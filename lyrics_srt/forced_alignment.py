"""Khmer forced alignment using KFA (Khmer Forced Aligner).

KFA uses a Khmer-trained Wav2Vec2 model + Phonetisaurus to produce
word-level timestamps that are far more accurate for Khmer lyrics than
the generic CTC forced aligner.

Falls back to the generic CTC aligner if KFA is not installed, and
ultimately to plain Whisper timing if both fail (handled in
``srt_handlers._build_timed_lyrics``).
"""

from __future__ import annotations

import asyncio
import subprocess
from pathlib import Path

from lyrics_srt.errors import SrtGenerationFailed
from lyrics_srt.exporters import TimedLyricLine
from lyrics_srt.ffmpeg import ensure_ffmpeg
from utils.logger import get_logger

logger = get_logger("lyrics_srt.forced_alignment")

_KFA_SESSION_CACHE = {}


async def align_lyrics_with_ctc(
    audio_path: Path,
    lyric_lines: list[str],
    language: str,
    batch_size: int,
) -> list[TimedLyricLine]:
    """Align lyrics using KFA (preferred) or generic CTC (fallback).

    The function signature is kept compatible with the rest of the
    codebase so callers do not need any changes.
    """

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        _align_lyrics_sync,
        audio_path,
        lyric_lines,
        language,
        batch_size,
    )


def _align_lyrics_sync(
    audio_path: Path,
    lyric_lines: list[str],
    language: str,
    batch_size: int,
) -> list[TimedLyricLine]:
    """Try KFA first; fall back to generic CTC if KFA is unavailable."""

    if not lyric_lines:
        raise SrtGenerationFailed("No lyric lines to align.")

    # --- Attempt 1: KFA (Khmer-specific aligner) ---
    if language in {"km", "khm", "khmer"}:
        try:
            return _align_with_kfa(audio_path, lyric_lines)
        except ImportError:
            logger.warning(
                "KFA is not installed; falling back to generic CTC aligner.  "
                "Install with: pip install kfa"
            )
        except Exception as exc:
            logger.warning(
                "KFA alignment failed; falling back to generic CTC: %s", exc
            )

    # --- Attempt 2: Generic CTC forced aligner ---
    return _align_with_generic_ctc(audio_path, lyric_lines, language, batch_size)


# ---------------------------------------------------------------------------
# KFA (Khmer Forced Aligner)
# ---------------------------------------------------------------------------


def _align_with_kfa(
    audio_path: Path,
    lyric_lines: list[str],
) -> list[TimedLyricLine]:
    """Word-level Khmer alignment using the ``kfa`` package."""

    ensure_ffmpeg()

    from kfa import align, create_session
    import librosa

    # KFA requires 16 kHz mono audio
    wav_16k_path = _resample_to_16k(audio_path)

    y, sr = librosa.load(str(wav_16k_path), sr=16000, mono=True)

    # Reuse session to avoid reloading the model every call
    session = _KFA_SESSION_CACHE.get("default")
    if session is None:
        session = create_session()
        _KFA_SESSION_CACHE["default"] = session

    full_text = "\n".join(lyric_lines)
    raw_alignments = list(align(y, sr, full_text, session=session))

    if not raw_alignments:
        raise SrtGenerationFailed("KFA returned no alignments.")

    logger.info("KFA returned %d word-level alignments", len(raw_alignments))
    return _map_kfa_words_to_lines(lyric_lines, raw_alignments)


def _resample_to_16k(audio_path: Path) -> Path:
    """Resample audio to 16 kHz mono WAV (required by KFA)."""

    output_path = audio_path.parent / "audio_16k.wav"
    if output_path.exists():
        return output_path

    ffmpeg_bin = ensure_ffmpeg()
    cmd = [
        ffmpeg_bin,
        "-y",
        "-i", str(audio_path),
        "-ac", "1",
        "-ar", "16000",
        str(output_path),
    ]

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120,
        )
        if result.returncode != 0:
            raise SrtGenerationFailed(
                f"FFmpeg resample failed: {result.stderr[:200]}"
            )
    except FileNotFoundError:
        raise SrtGenerationFailed("FFmpeg is required for audio resampling.")

    return output_path


def _map_kfa_words_to_lines(
    lyric_lines: list[str],
    alignments: list,
) -> list[TimedLyricLine]:
    """Map KFA word-level alignments back onto user-provided lyric lines.

    KFA returns one alignment dict per word/token.  We greedily assign
    words to lyric lines by walking through both lists in order, matching
    words by their text content.
    """

    # Build a flat list of (start, end) from KFA results
    word_timings: list[tuple[float, float, str]] = []
    for item in alignments:
        if isinstance(item, dict):
            start = float(item.get("start", 0))
            end = float(item.get("end", 0))
            word = str(item.get("word", item.get("text", ""))).strip()
        else:
            # Some KFA versions return named-tuple-like objects
            start = float(getattr(item, "start", 0))
            end = float(getattr(item, "end", 0))
            word = str(getattr(item, "word", getattr(item, "text", ""))).strip()

        if end > start and word:
            word_timings.append((start, end, word))

    if not word_timings:
        raise SrtGenerationFailed("KFA produced no valid word timings.")

    # Distribute word timings across lyric lines proportionally by character count
    total_chars = sum(max(1, len(line.replace(" ", ""))) for line in lyric_lines)
    total_words = len(word_timings)

    timed_lines: list[TimedLyricLine] = []
    word_cursor = 0

    for idx, line in enumerate(lyric_lines, start=1):
        line_chars = max(1, len(line.replace(" ", "")))
        # Proportional number of word timings for this line
        if idx == len(lyric_lines):
            # Last line takes all remaining words
            word_count = total_words - word_cursor
        else:
            word_count = max(1, round(line_chars / total_chars * total_words))

        end_cursor = min(total_words, word_cursor + word_count)
        if end_cursor <= word_cursor:
            end_cursor = min(total_words, word_cursor + 1)

        group = word_timings[word_cursor:end_cursor]

        if group:
            line_start = group[0][0]
            line_end = group[-1][1]
        elif timed_lines:
            line_start = timed_lines[-1].end
            line_end = line_start + 0.6
        else:
            line_start = word_timings[0][0]
            line_end = line_start + 0.6

        if line_end <= line_start:
            line_end = line_start + 0.6

        timed_lines.append(
            TimedLyricLine(index=idx, start=line_start, end=line_end, text=line)
        )
        word_cursor = end_cursor

    return timed_lines


# ---------------------------------------------------------------------------
# Generic CTC forced aligner (fallback for non-Khmer or when KFA missing)
# ---------------------------------------------------------------------------


def _align_with_generic_ctc(
    audio_path: Path,
    lyric_lines: list[str],
    language: str,
    batch_size: int,
) -> list[TimedLyricLine]:
    """CTC forced alignment using ``ctc-forced-aligner`` (fallback)."""

    ensure_ffmpeg()

    try:
        import torch
        from ctc_forced_aligner import (
            generate_emissions,
            get_alignments,
            get_spans,
            load_alignment_model,
            load_audio,
            postprocess_results,
            preprocess_text,
        )
    except Exception as exc:  # pragma: no cover - optional dependency
        raise SrtGenerationFailed(
            "Neither KFA nor CTC forced aligner is installed. "
            "Install with: pip install kfa   (or)   pip install ctc-forced-aligner"
        ) from exc

    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32
        alignment_model, alignment_tokenizer = load_alignment_model(device, dtype=dtype)
        audio_waveform = load_audio(str(audio_path), alignment_model.dtype, alignment_model.device)

        full_text = " ".join(lyric_lines)
        emissions, stride = generate_emissions(
            alignment_model,
            audio_waveform,
            batch_size=batch_size,
        )
        tokens_starred, text_starred = preprocess_text(
            full_text,
            romanize=True,
            language=language,
        )
        segments, scores, blank_token = get_alignments(
            emissions,
            tokens_starred,
            alignment_tokenizer,
        )
        spans = get_spans(tokens_starred, segments, blank_token)
        aligned_items = postprocess_results(text_starred, spans, stride, scores)
    except Exception as exc:
        raise SrtGenerationFailed(f"CTC forced alignment failed: {exc}") from exc

    token_segments = _normalise_ctc_items(aligned_items)
    if not token_segments:
        raise SrtGenerationFailed("CTC forced alignment returned no timestamps.")

    line_token_counts = [
        max(1, _count_aligned_units(line, language, preprocess_text))
        for line in lyric_lines
    ]
    return _group_token_segments_by_line(lyric_lines, token_segments, line_token_counts)


def _normalise_ctc_items(items) -> list[tuple[float, float]]:
    token_segments = []
    for item in items or []:
        if not isinstance(item, dict):
            continue
        try:
            start = float(item.get("start"))
            end = float(item.get("end"))
        except (TypeError, ValueError):
            continue
        if end > start:
            token_segments.append((start, end))
    return token_segments


def _count_aligned_units(line: str, language: str, preprocess_text) -> int:
    try:
        _, text_starred = preprocess_text(line, romanize=True, language=language)
    except Exception:
        text_starred = line
    return len(_split_aligned_text(text_starred))


def _split_aligned_text(value: str) -> list[str]:
    cleaned = (
        value.replace("*", " ")
        .replace("|", " ")
        .replace("\n", " ")
        .strip()
    )
    return [part for part in cleaned.split() if part]


def _group_token_segments_by_line(
    lyric_lines: list[str],
    token_segments: list[tuple[float, float]],
    line_token_counts: list[int],
) -> list[TimedLyricLine]:
    total_required = sum(line_token_counts)
    if total_required <= 0:
        raise SrtGenerationFailed("Could not count lyric tokens for forced alignment.")

    scale = len(token_segments) / total_required
    cursor = 0
    timed_lines = []

    for index, (text, count) in enumerate(zip(lyric_lines, line_token_counts), start=1):
        scaled_count = max(1, round(count * scale))
        if index == len(lyric_lines):
            end_cursor = len(token_segments)
        else:
            end_cursor = min(len(token_segments), max(cursor + 1, cursor + scaled_count))

        group = token_segments[cursor:end_cursor]
        if not group:
            previous_end = timed_lines[-1].end if timed_lines else token_segments[0][0]
            timed_lines.append(
                TimedLyricLine(index=index, start=previous_end, end=previous_end + 0.6, text=text)
            )
            continue

        start = group[0][0]
        end = group[-1][1]
        if end <= start:
            end = start + 0.6
        timed_lines.append(TimedLyricLine(index=index, start=start, end=end, text=text))
        cursor = end_cursor

    return timed_lines
