"""CTC forced alignment for user-provided lyrics.

When vocal separation (Demucs) is enabled, the CTC aligner receives a clean
vocal track instead of the full mix.  This dramatically improves alignment
accuracy for Khmer songs with loud background music.

Falls back to plain Whisper timing if CTC alignment fails (handled in
``srt_handlers._build_timed_lyrics``).
"""

from __future__ import annotations

import asyncio
from pathlib import Path

from lyrics_srt.errors import SrtGenerationFailed
from lyrics_srt.exporters import TimedLyricLine
from lyrics_srt.ffmpeg import ensure_ffmpeg


async def align_lyrics_with_ctc(
    audio_path: Path,
    lyric_lines: list[str],
    language: str,
    batch_size: int,
) -> list[TimedLyricLine]:
    """Align lyrics with CTC forced alignment in a worker thread."""

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        _align_lyrics_with_ctc_sync,
        audio_path,
        lyric_lines,
        language,
        batch_size,
    )


def _align_lyrics_with_ctc_sync(
    audio_path: Path,
    lyric_lines: list[str],
    language: str,
    batch_size: int,
) -> list[TimedLyricLine]:
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
            "CTC forced aligner is not installed. Install requirements.txt or set SRT_ALIGNMENT_ENGINE=whisper."
        ) from exc

    if not lyric_lines:
        raise SrtGenerationFailed("No lyric lines to align.")

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


def _split_aligned_text(value: str | list[str]) -> list[str]:
    if isinstance(value, list):
        return [str(v) for v in value if str(v).strip()]
        
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

    # If the aligner returns fewer/more units than the text normalization counted,
    # scale counts so every lyric line still receives a sequential timestamp range.
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
