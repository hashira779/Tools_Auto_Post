"""Detect vocal timing with Whisper and map user lyrics onto the timestamps."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from pathlib import Path

from lyrics_srt.errors import MissingLyricsText, SrtGenerationFailed
from lyrics_srt.exporters import TimedLyricLine
from lyrics_srt.ffmpeg import ensure_ffmpeg


@dataclass(frozen=True)
class AudioSegment:
    start: float
    end: float


_MODEL_CACHE = {}


def split_lyrics(lyrics: str) -> list[str]:
    """Split user lyrics into non-empty subtitle lines."""

    lines = [line.strip() for line in lyrics.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    lines = [line for line in lines if line]
    if not lines:
        raise MissingLyricsText()
    return lines


async def detect_audio_segments(
    audio_path: Path,
    model_name: str,
    language: str | None,
) -> list[AudioSegment]:
    """Run Whisper in a worker thread and return detected audio segments."""

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        _detect_audio_segments_sync,
        audio_path,
        model_name,
        language,
    )


def _detect_audio_segments_sync(
    audio_path: Path,
    model_name: str,
    language: str | None,
) -> list[AudioSegment]:
    ensure_ffmpeg()

    try:
        import whisper
    except Exception as exc:  # pragma: no cover - depends on local install
        raise SrtGenerationFailed(
            "Whisper is not installed. Run pip install -r requirements.txt."
        ) from exc

    try:
        model = _MODEL_CACHE.get(model_name)
        if model is None:
            model = whisper.load_model(model_name)
            _MODEL_CACHE[model_name] = model

        options = {
            "task": "transcribe",
            "fp16": False,
            "verbose": False,
        }
        if language:
            options["language"] = language

        result = model.transcribe(str(audio_path), **options)
    except Exception as exc:
        raise SrtGenerationFailed(f"Whisper processing failed: {exc}") from exc

    segments = []
    for segment in result.get("segments", []):
        start = float(segment.get("start") or 0)
        end = float(segment.get("end") or 0)
        if end - start >= 0.2:
            segments.append(AudioSegment(start=start, end=end))

    return segments


def match_lyrics_to_timestamps(
    lyric_lines: list[str],
    detected_segments: list[AudioSegment],
    audio_duration: float,
    fallback_start_seconds: float | None = None,
    late_start_threshold_seconds: float = 30.0,
) -> list[TimedLyricLine]:
    """Map user-provided lyric lines onto Whisper-detected vocal timing.

    Whisper text is intentionally ignored. We only use segment start/end times,
    then allocate those voiced spans to the user's lyric lines by character
    weight so longer Khmer lines receive slightly more time.
    """

    if not lyric_lines:
        raise MissingLyricsText()

    segments = _normalise_segments(detected_segments, audio_duration)
    segments = _shift_late_segments(
        segments=segments,
        fallback_start_seconds=fallback_start_seconds,
        late_start_threshold_seconds=late_start_threshold_seconds,
        audio_duration=audio_duration,
    )
    if not segments:
        duration = max(audio_duration, float(len(lyric_lines)) * 2.0, 1.0)
        start = min(max(fallback_start_seconds or 0.0, 0.0), max(duration - 0.5, 0.0))
        segments = [AudioSegment(start, duration)]

    total_voiced = sum(max(0.0, segment.end - segment.start) for segment in segments)
    if total_voiced <= 0:
        raise SrtGenerationFailed("No usable audio timestamps were detected.")

    weights = [max(1, len(line)) for line in lyric_lines]
    total_weight = sum(weights)

    timed_lines = []
    previous_voice_offset = 0.0

    for idx, (line, weight) in enumerate(zip(lyric_lines, weights), start=1):
        next_voice_offset = total_voiced * sum(weights[:idx]) / total_weight
        start = _voice_offset_to_absolute(segments, previous_voice_offset)
        end = _voice_offset_to_absolute(segments, next_voice_offset)
        previous_voice_offset = next_voice_offset

        if end <= start:
            end = start + 0.6

        timed_lines.append(TimedLyricLine(index=idx, start=start, end=end, text=line))

    return _enforce_monotonic_timing(timed_lines)


def _normalise_segments(
    segments: list[AudioSegment],
    audio_duration: float,
) -> list[AudioSegment]:
    clean = []
    for segment in sorted(segments, key=lambda item: item.start):
        start = max(0.0, segment.start)
        end = max(start, segment.end)
        if audio_duration > 0:
            end = min(end, audio_duration)
        if end - start >= 0.2:
            clean.append(AudioSegment(start=start, end=end))
    return clean


def _shift_late_segments(
    segments: list[AudioSegment],
    fallback_start_seconds: float | None,
    late_start_threshold_seconds: float,
    audio_duration: float,
) -> list[AudioSegment]:
    if not segments or fallback_start_seconds is None:
        return segments

    first_start = segments[0].start
    if first_start <= late_start_threshold_seconds:
        return segments

    target_start = max(0.0, fallback_start_seconds)
    if audio_duration > 0:
        target_start = min(target_start, max(audio_duration - 0.5, 0.0))

    delta = first_start - target_start
    shifted = []
    for segment in segments:
        start = max(0.0, segment.start - delta)
        end = max(start + 0.2, segment.end - delta)
        if audio_duration > 0:
            end = min(end, audio_duration)
        if end - start >= 0.2:
            shifted.append(AudioSegment(start=start, end=end))

    return shifted or segments


def _voice_offset_to_absolute(segments: list[AudioSegment], voice_offset: float) -> float:
    if voice_offset <= 0:
        return segments[0].start

    elapsed = 0.0
    for segment in segments:
        duration = segment.end - segment.start
        if elapsed + duration >= voice_offset:
            return segment.start + (voice_offset - elapsed)
        elapsed += duration

    return segments[-1].end


def _enforce_monotonic_timing(lines: list[TimedLyricLine]) -> list[TimedLyricLine]:
    fixed = []
    previous_end = 0.0

    for line in lines:
        start = max(line.start, previous_end)
        end = max(line.end, start + 0.4)
        fixed_line = TimedLyricLine(
            index=line.index,
            start=start,
            end=end,
            text=line.text,
        )
        fixed.append(fixed_line)
        previous_end = fixed_line.end

    return fixed
