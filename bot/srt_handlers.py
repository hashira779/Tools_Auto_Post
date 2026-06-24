"""Telegram handlers for manual SRT generation."""

from __future__ import annotations

import asyncio
import html
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
from lyrics_srt.exporters import save_lyrics_text, write_lrc, write_srt, TimedLyricLine
from lyrics_srt.timing import (
    split_lyrics,
    extract_inline_timestamps,
    enforce_monotonic_timing,
)
from utils.logger import get_logger


logger = get_logger("bot.srt_handlers")

FLOW_KEY = "srt_flow"
MODE_MANUAL = "manual"
STEP_AWAIT_LYRICS = "await_lyrics"

_is_authorized: Callable[[int], bool] | None = None


def setup_srt_handlers(
    application: Application,
    is_authorized: Callable[[int], bool],
) -> None:
    """Register SRT handlers."""

    global _is_authorized
    _is_authorized = is_authorized

    application.add_handler(CommandHandler("manual", cmd_manual))
    application.add_handler(CommandHandler("cancel", cmd_cancel))

    application.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, handle_srt_text),
        group=-1,
    )

    logger.info("Manual SRT handlers registered")


async def cmd_manual(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Start instant manual SRT generation."""
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


async def cmd_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Cancel the current SRT flow."""

    if not await _check_authorized(update):
        return

    flow = context.user_data.pop(FLOW_KEY, None)
    if not flow:
        await update.message.reply_text("No active job to cancel.")
        return

    work_dir = Path(flow["work_dir"]) if flow.get("work_dir") else None

    if work_dir:
        shutil.rmtree(work_dir, ignore_errors=True)
    await update.message.reply_text("Cancelled.")


async def handle_srt_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle lyrics messages while a user is in /manual mode."""

    flow = context.user_data.get(FLOW_KEY)
    if not flow:
        return

    if not await _check_authorized(update):
        raise ApplicationHandlerStop

    text = update.message.text or ""
    step = flow.get("step")

    if step == STEP_AWAIT_LYRICS:
        await _run_manual_srt(update, context, flow, text)
        raise ApplicationHandlerStop

    raise ApplicationHandlerStop


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


async def _send_output_file(bot, chat_id: int, path: Path, filename: str) -> None:
    with path.open("rb") as file_obj:
        await bot.send_document(
            chat_id=chat_id,
            document=file_obj,
            filename=filename,
            read_timeout=120,
            write_timeout=120,
        )


async def _check_authorized(update: Update) -> bool:
    if _is_authorized and not _is_authorized(update.effective_user.id):
        await update.message.reply_text("You are not authorized to use this bot.")
        return False
    return True


def _make_work_dir(chat_id: int, user_id: int) -> Path:
    job_id = uuid.uuid4().hex[:10]
    return Path(config.SRT_WORK_DIR) / f"{chat_id}_{user_id}_{job_id}"
