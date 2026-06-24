"""Telegram handlers for YouTube lyric SRT generation."""

from __future__ import annotations

import asyncio
import html
import re
import shutil
import uuid
from pathlib import Path
from typing import Callable

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    ApplicationHandlerStop,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from config import config
from lyrics_srt.errors import (
    AudioTooLong,
    DownloadFailed,
    InvalidYouTubeLink,
    MissingLyricsText,
    SrtBotError,
    SrtGenerationFailed,
)
from lyrics_srt.exporters import save_lyrics_text, write_lrc, write_srt, TimedLyricLine
from lyrics_srt.forced_alignment import align_lyrics_with_ctc
from lyrics_srt.timing import (
    detect_audio_segments,
    match_lyrics_to_timestamps,
    split_lyrics,
    extract_inline_timestamps,
    enforce_monotonic_timing,
)
from lyrics_srt.video import create_lyric_video
from lyrics_srt.youtube_audio import download_youtube_audio, is_youtube_url
from utils.logger import get_logger


logger = get_logger("bot.srt_handlers")

FLOW_KEY = "srt_flow"
MODE_SRT = "srt"
MODE_VIDEO = "video"
MODE_MANUAL = "manual"
STEP_AWAIT_URL = "await_url"
STEP_AWAIT_LYRICS = "await_lyrics"
STEP_AWAIT_IMAGE = "await_image"

_srt_semaphore: asyncio.Semaphore | None = None
_is_authorized: Callable[[int], bool] | None = None


def setup_srt_handlers(
    application: Application,
    is_authorized: Callable[[int], bool],
) -> None:
    """Register SRT handlers before the generic auto-post text handler."""

    global _srt_semaphore, _is_authorized
    _srt_semaphore = asyncio.Semaphore(config.SRT_MAX_CONCURRENT_TASKS)
    _is_authorized = is_authorized

    application.add_handler(CommandHandler("srt", cmd_srt))
    application.add_handler(CommandHandler("srtmp4", cmd_srt_video))
    application.add_handler(CommandHandler("manual", cmd_manual))
    application.add_handler(CommandHandler("cancel", cmd_cancel))

    application.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, handle_srt_text),
        group=-1,
    )
    application.add_handler(
        MessageHandler(filters.PHOTO | filters.Document.IMAGE, handle_srt_image),
        group=-1,
    )

    logger.info("SRT handlers registered")


async def cmd_srt(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Start normal SRT/LRC generation."""

    if not await _check_authorized(update):
        return

    args = list(context.args or [])
    mode = MODE_SRT
    if args and args[0].lower() in {"video", "mp4", "lyric-video", "lyric_video"}:
        mode = MODE_VIDEO
        args = args[1:]

    start_seconds, args = _parse_start_arg(args)
    await _start_flow(
        update,
        context,
        mode=mode,
        initial_url=_find_url(args),
        forced_start_seconds=start_seconds,
    )


async def cmd_manual(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Start instant manual SRT generation without YouTube."""
    if not await _check_authorized(update):
        return

    old_flow = context.user_data.pop(FLOW_KEY, None)
    if old_flow and old_flow.get("work_dir") and not old_flow.get("task"):
        shutil.rmtree(old_flow["work_dir"], ignore_errors=True)

    work_dir = _make_work_dir(
        chat_id=update.effective_chat.id,
        user_id=update.effective_user.id,
    )
    work_dir.mkdir(parents=True, exist_ok=True)

    flow = {
        "mode": MODE_MANUAL,
        "step": STEP_AWAIT_LYRICS,
        "chat_id": update.effective_chat.id,
        "user_id": update.effective_user.id,
        "work_dir": str(work_dir),
    }
    context.user_data[FLOW_KEY] = flow

    await update.message.reply_text(
        "⚡ *Instant Manual Mode*\n\n"
        "Send your lyrics with manual timestamps on every line.\n"
        "Example:\n"
        "Line one 0:10 - 0:13\n"
        "Line two 0:14\n\n"
        "Use /cancel to stop.",
        parse_mode=ParseMode.MARKDOWN
    )


async def cmd_srt_video(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Start SRT/LRC generation plus optional MP4 lyric video creation."""

    if not await _check_authorized(update):
        return

    start_seconds, args = _parse_start_arg(list(context.args or []))
    await _start_flow(
        update,
        context,
        mode=MODE_VIDEO,
        initial_url=_find_url(args),
        forced_start_seconds=start_seconds,
    )


async def cmd_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Cancel the current SRT flow or queued job."""

    if not await _check_authorized(update):
        return

    flow = context.user_data.pop(FLOW_KEY, None)
    if not flow:
        await update.message.reply_text("No active /srt job to cancel.")
        return

    flow["cancel_requested"] = True
    task = flow.get("task")
    work_dir = Path(flow["work_dir"]) if flow.get("work_dir") else None

    if task and not task.done():
        task.cancel()
        await update.message.reply_text("Cancelled current /srt job.")
        return

    if work_dir:
        shutil.rmtree(work_dir, ignore_errors=True)
    await update.message.reply_text("Cancelled.")


async def handle_srt_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle URL and lyrics messages while a user is in /srt mode."""

    flow = context.user_data.get(FLOW_KEY)
    if not flow:
        return

    if not await _check_authorized(update):
        raise ApplicationHandlerStop

    text = update.message.text or ""
    step = flow.get("step")

    if step == STEP_AWAIT_URL:
        await _receive_url(update, context, flow, text)
        raise ApplicationHandlerStop

    if step == STEP_AWAIT_LYRICS:
        await _receive_lyrics(update, context, flow, text)
        raise ApplicationHandlerStop

    if step == STEP_AWAIT_IMAGE:
        await update.message.reply_text(
            "Please send a background image, or use /cancel to stop this /srt video job."
        )
        raise ApplicationHandlerStop

    raise ApplicationHandlerStop


async def handle_srt_image(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the background image for `/srt video`."""

    flow = context.user_data.get(FLOW_KEY)
    if not flow or flow.get("step") != STEP_AWAIT_IMAGE:
        return

    if not await _check_authorized(update):
        raise ApplicationHandlerStop

    try:
        image_path = await _download_background_image(update, context, Path(flow["work_dir"]))
    except Exception as exc:
        logger.error("Failed to receive background image: %s", exc, exc_info=True)
        await update.message.reply_text("Could not save that image. Please send a JPG or PNG image.")
        raise ApplicationHandlerStop

    flow["background_path"] = str(image_path)
    await _queue_job(update, context, flow)
    raise ApplicationHandlerStop


async def _start_flow(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    mode: str,
    initial_url: str | None,
    forced_start_seconds: float | None,
) -> None:
    old_flow = context.user_data.pop(FLOW_KEY, None)
    if old_flow and old_flow.get("work_dir") and not old_flow.get("task"):
        shutil.rmtree(old_flow["work_dir"], ignore_errors=True)

    flow = {
        "mode": mode,
        "step": STEP_AWAIT_URL,
        "chat_id": update.effective_chat.id,
        "user_id": update.effective_user.id,
        "forced_start_seconds": forced_start_seconds,
    }
    context.user_data[FLOW_KEY] = flow

    if initial_url:
        await _receive_url(update, context, flow, initial_url)
        return

    mode_hint = "SRT + LRC" if mode == MODE_SRT else "SRT + LRC + MP4 lyric video"
    await update.message.reply_text(
        f"{mode_hint}\n\n"
        "Send a YouTube song link.\n\n"
        "Only process songs you own or have permission to use.\n"
        "Use /cancel to stop."
    )


async def _receive_url(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    flow: dict,
    text: str,
) -> None:
    url = _extract_youtube_url(text)
    if not url:
        await update.message.reply_text(InvalidYouTubeLink.user_message)
        return

    work_dir = _make_work_dir(
        chat_id=update.effective_chat.id,
        user_id=update.effective_user.id,
    )
    work_dir.mkdir(parents=True, exist_ok=True)

    flow.update(
        {
            "url": url,
            "work_dir": str(work_dir),
            "step": STEP_AWAIT_LYRICS,
        }
    )
    start_note = ""
    if flow.get("forced_start_seconds") is not None:
        start_note = f"\nForced first lyric start: {_format_seconds(flow['forced_start_seconds'])}."

    await update.message.reply_text(
        "YouTube link saved."
        f"{start_note}\n\n"
        "Now send the Khmer lyrics/script text. Put each subtitle line on its own line."
    )


async def _receive_lyrics(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    flow: dict,
    text: str,
) -> None:
    try:
        split_lyrics(text)
    except MissingLyricsText:
        await update.message.reply_text(MissingLyricsText.user_message)
        return

    lyrics_path = Path(flow["work_dir"]) / "lyrics.txt"
    save_lyrics_text(text, lyrics_path)
    flow["lyrics_path"] = str(lyrics_path)

    if flow.get("mode") == MODE_VIDEO:
        flow["step"] = STEP_AWAIT_IMAGE
        await update.message.reply_text(
            "Lyrics saved as lyrics.txt.\n\n"
            "Now send a background image for the MP4 lyric video."
        )
        return

    if flow.get("mode") == MODE_MANUAL:
        await _run_manual_srt(update, context, flow, text)
        return

    await _queue_job(update, context, flow)


async def _queue_job(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    flow: dict,
) -> None:
    if flow.get("task") and not flow["task"].done():
        await update.message.reply_text("Your /srt job is already running.")
        return

    flow["step"] = "queued"
    status_msg = await update.message.reply_text("Queued. Waiting for an available subtitle slot...")

    task = context.application.create_task(
        _run_srt_job(
            bot=context.bot,
            user_data=context.user_data,
            flow=flow,
            status_message_id=status_msg.message_id,
        )
    )
    flow["task"] = task


async def _run_srt_job(
    bot,
    user_data: dict,
    flow: dict,
    status_message_id: int,
) -> None:
    chat_id = flow["chat_id"]
    work_dir = Path(flow["work_dir"])
    status_kwargs = {"chat_id": chat_id, "message_id": status_message_id}

    try:
        if _srt_semaphore is None:
            raise SrtGenerationFailed("SRT queue was not initialized.")

        async with _srt_semaphore:
            await bot.edit_message_text("Downloading audio", **status_kwargs)
            audio = await download_youtube_audio(
                url=flow["url"],
                work_dir=work_dir,
                max_duration_seconds=config.SRT_MAX_AUDIO_SECONDS,
            )
            _raise_if_cancelled(flow)

            await bot.edit_message_text("Processing audio", **status_kwargs)
            lyrics = Path(flow["lyrics_path"]).read_text(encoding="utf-8")
            lyric_lines = split_lyrics(lyrics)
            
            clean_lines, forced_times = extract_inline_timestamps(lyric_lines)
            forced_start = flow.get("forced_start_seconds")
            if forced_start is None and 0 in forced_times:
                forced_start = forced_times[0][0]
                
            timed_lines = await _build_timed_lyrics(
                audio_path=audio.audio_path,
                audio_duration=audio.duration,
                lyric_lines=clean_lines,
                forced_start_seconds=forced_start,
                forced_times=forced_times,
                status_callback=lambda message: bot.edit_message_text(message, **status_kwargs),
            )

            await bot.edit_message_text("Generating SRT", **status_kwargs)
            srt_path = work_dir / "song.srt"
            lrc_path = work_dir / "song.lrc"
            write_srt(timed_lines, srt_path)
            write_lrc(timed_lines, lrc_path)

            if not srt_path.exists() or srt_path.stat().st_size == 0:
                raise SrtGenerationFailed()

            await _send_output_file(bot, chat_id, srt_path, "song.srt")
            await _send_output_file(bot, chat_id, lrc_path, "song.lrc")

            if flow.get("mode") == MODE_VIDEO:
                await bot.edit_message_text("Generating MP4 lyric video", **status_kwargs)
                mp4_path = work_dir / "lyric_video.mp4"
                await create_lyric_video(
                    audio_path=audio.audio_path,
                    srt_path=srt_path,
                    background_path=Path(flow["background_path"]),
                    output_path=mp4_path,
                )
                await _send_output_file(bot, chat_id, mp4_path, "lyric_video.mp4")

            await bot.edit_message_text("Done", **status_kwargs)

    except asyncio.CancelledError:
        try:
            await bot.edit_message_text("Cancelled.", **status_kwargs)
        except Exception:
            pass
        raise
    except InvalidYouTubeLink as exc:
        await bot.edit_message_text(exc.user_message, **status_kwargs)
    except MissingLyricsText as exc:
        await bot.edit_message_text(exc.user_message, **status_kwargs)
    except AudioTooLong as exc:
        await bot.edit_message_text(str(exc) or exc.user_message, **status_kwargs)
    except DownloadFailed as exc:
        logger.error("SRT download failed: %s", exc, exc_info=True)
        await bot.edit_message_text(str(exc) or exc.user_message, **status_kwargs)
    except SrtBotError as exc:
        logger.error("SRT generation error: %s", exc, exc_info=True)
        await bot.edit_message_text(str(exc) or exc.user_message, **status_kwargs)
    except Exception as exc:
        logger.error("Unexpected SRT job failure: %s", exc, exc_info=True)
        await bot.edit_message_text(SrtGenerationFailed.user_message, **status_kwargs)
    finally:
        active_flow = user_data.get(FLOW_KEY)
        if active_flow is flow:
            user_data.pop(FLOW_KEY, None)
        shutil.rmtree(work_dir, ignore_errors=True)


async def _run_manual_srt(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    flow: dict,
    text: str,
) -> None:
    work_dir = Path(flow["work_dir"])
    chat_id = flow["chat_id"]
    bot = context.bot
    
    try:
        lyric_lines = split_lyrics(text)
        clean_lines, forced_times = extract_inline_timestamps(lyric_lines)
        
        timed_lines = []
        for idx, line in enumerate(clean_lines):
            start = forced_times.get(idx, (0.0, None))[0]
            end = forced_times.get(idx, (0.0, None))[1]
            if end is None:
                end = start + 2.0
            
            timed_lines.append(TimedLyricLine(index=idx + 1, start=start, end=end, text=line))
            
        timed_lines = enforce_monotonic_timing(timed_lines, forced_times)
        
        srt_path = work_dir / "song.srt"
        lrc_path = work_dir / "song.lrc"
        write_srt(timed_lines, srt_path)
        write_lrc(timed_lines, lrc_path)

        await _send_output_file(bot, chat_id, srt_path, "song.srt")
        await _send_output_file(bot, chat_id, lrc_path, "song.lrc")
        await update.message.reply_text("⚡ Done!")
        
    except Exception as exc:
        logger.error("Manual SRT failed: %s", exc, exc_info=True)
        await update.message.reply_text("Failed to generate manual SRT. Make sure your timestamps are formatted like 0:10.")
    finally:
        active_flow = context.user_data.get(FLOW_KEY)
        if active_flow is flow:
            context.user_data.pop(FLOW_KEY, None)
        shutil.rmtree(work_dir, ignore_errors=True)


async def _build_timed_lyrics(
    audio_path: Path,
    audio_duration: float,
    lyric_lines: list[str],
    forced_start_seconds: float | None,
    forced_times: dict[int, tuple[float, float | None]],
    status_callback,
) -> list:
    engine = config.SRT_ALIGNMENT_ENGINE

    # --- Step 1: Vocal separation (strip background music) ---
    alignment_audio = audio_path
    if config.SRT_VOCAL_SEPARATION:
        try:
            await status_callback("Separating vocals")
            from lyrics_srt.vocal_separator import separate_vocals
            alignment_audio = await separate_vocals(
                audio_path=audio_path,
                work_dir=audio_path.parent,
                model_name=config.SRT_DEMUCS_MODEL,
            )
            if alignment_audio != audio_path:
                logger.info("Using separated vocals for alignment: %s", alignment_audio)
        except Exception as exc:
            logger.warning("Vocal separation failed; using original audio: %s", exc)
            alignment_audio = audio_path

    # --- Step 2: Forced alignment ---
    timed_lines = None
    if engine in {"auto", "ctc"}:
        try:
            await status_callback("Matching lyrics")
            timed_lines = await align_lyrics_with_ctc(
                audio_path=alignment_audio,
                lyric_lines=lyric_lines,
                language=config.SRT_CTC_LANGUAGE,
                batch_size=config.SRT_CTC_BATCH_SIZE,
            )
        except Exception as exc:
            if engine == "ctc":
                raise
            logger.warning("CTC forced alignment failed; falling back to Whisper timing: %s", exc)

    # --- Step 3: Whisper fallback ---
    if not timed_lines:
        await status_callback("Processing audio")
        segments = await detect_audio_segments(
            audio_path=alignment_audio,
            model_name=config.SRT_WHISPER_MODEL,
            language=config.SRT_WHISPER_LANGUAGE,
        )
        await status_callback("Matching lyrics")
        timed_lines = match_lyrics_to_timestamps(
            lyric_lines=lyric_lines,
            detected_segments=segments,
            audio_duration=audio_duration,
            fallback_start_seconds=(
                forced_start_seconds
                if forced_start_seconds is not None
                else config.SRT_FALLBACK_START_SECONDS
            ),
            late_start_threshold_seconds=config.SRT_LATE_WHISPER_START_SECONDS,
        )

    # --- Step 4: Apply forced times and enforce monotonicity ---
    return enforce_monotonic_timing(timed_lines, forced_times)


async def _send_output_file(bot, chat_id: int, path: Path, filename: str) -> None:
    if path.suffix.lower() == ".mp4" and path.stat().st_size > config.SRT_MAX_TELEGRAM_FILE_MB * 1024 * 1024:
        await bot.send_message(
            chat_id=chat_id,
            text=(
                f"{html.escape(filename)} was created but is too large to send through Telegram "
                f"({path.stat().st_size / 1024 / 1024:.1f} MB)."
            ),
            parse_mode=ParseMode.HTML,
        )
        return

    with path.open("rb") as file_obj:
        await bot.send_document(
            chat_id=chat_id,
            document=file_obj,
            filename=filename,
            read_timeout=120,
            write_timeout=120,
        )


async def _download_background_image(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    work_dir: Path,
) -> Path:
    if update.message.photo:
        telegram_file = await context.bot.get_file(update.message.photo[-1].file_id)
        image_path = work_dir / "background.jpg"
    else:
        document = update.message.document
        suffix = Path(document.file_name or "").suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
            suffix = ".jpg"
        telegram_file = await context.bot.get_file(document.file_id)
        image_path = work_dir / f"background{suffix}"

    await telegram_file.download_to_drive(custom_path=str(image_path))
    return image_path


async def _check_authorized(update: Update) -> bool:
    if _is_authorized and not _is_authorized(update.effective_user.id):
        await update.message.reply_text("You are not authorized to use this bot.")
        return False
    return True


def _find_url(args) -> str | None:
    return _extract_youtube_url(" ".join(args))


def _parse_start_arg(args: list[str]) -> tuple[float | None, list[str]]:
    remaining = []
    start_seconds = None

    for arg in args:
        lowered = arg.lower()
        raw_value = None
        if lowered.startswith("start="):
            raw_value = arg.split("=", 1)[1]
        elif lowered.startswith("--start="):
            raw_value = arg.split("=", 1)[1]
        elif start_seconds is None and _looks_like_time_arg(arg):
            raw_value = arg

        if raw_value is not None and start_seconds is None:
            parsed = _parse_time_to_seconds(raw_value)
            if parsed is not None:
                start_seconds = parsed
                continue

        remaining.append(arg)

    return start_seconds, remaining


def _looks_like_time_arg(value: str) -> bool:
    value = value.strip()
    return bool(re.fullmatch(r"\d+(\.\d+)?|\d{1,2}:\d{1,2}(\.\d+)?|\d{1,2}:\d{2}:\d{1,2}(\.\d+)?", value))


def _parse_time_to_seconds(value: str) -> float | None:
    value = value.strip()
    try:
        if ":" not in value:
            return max(0.0, float(value))

        parts = [float(part) for part in value.split(":")]
        if len(parts) == 2:
            minutes, seconds = parts
            return max(0.0, minutes * 60 + seconds)
        if len(parts) == 3:
            hours, minutes, seconds = parts
            return max(0.0, hours * 3600 + minutes * 60 + seconds)
    except ValueError:
        return None

    return None


def _format_seconds(seconds: float) -> str:
    seconds = max(0.0, float(seconds))
    minutes, secs = divmod(int(round(seconds)), 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def _extract_youtube_url(text: str) -> str | None:
    for match in re.findall(r"https?://\S+", text):
        candidate = match.strip(" \t\r\n<>[](){}.,;\"'")
        if is_youtube_url(candidate):
            return candidate
    candidate = text.strip()
    return candidate if is_youtube_url(candidate) else None


def _make_work_dir(chat_id: int, user_id: int) -> Path:
    job_id = uuid.uuid4().hex[:10]
    return Path(config.SRT_WORK_DIR) / f"{chat_id}_{user_id}_{job_id}"


def _raise_if_cancelled(flow: dict) -> None:
    if flow.get("cancel_requested"):
        raise asyncio.CancelledError()
