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

    return timed_lines


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


import re

def parse_time_to_seconds(value: str) -> float | None:
    value = value.strip()
    try:
        # Handle "0.13" or "1.02" as mm:ss if there are no colons
        if ":" not in value and "." in value:
            parts = value.split(".")
            if len(parts) == 2:
                return max(0.0, float(parts[0]) * 60 + float(parts[1]))
            
        if ":" not in value:
            return max(0.0, float(value))
            
        parts = [float(part) for part in value.split(":")]
        if len(parts) == 2:
            return max(0.0, parts[0] * 60 + parts[1])
        if len(parts) == 3:
            return max(0.0, parts[0] * 3600 + parts[1] * 60 + parts[2])
    except ValueError:
        return None
    return None


def extract_inline_timestamps(lyric_lines: list[str]) -> tuple[list[str], dict[int, tuple[float, float | None]]]:
    clean_lines = []
    forced_times = {}
    
    # Matches patterns like 0:10, 0:10-0:13, 0.13, 1.02, [00:10.00] at the end of the line
    pattern = re.compile(
        r'(?:\[)?\b(\d{1,2}[:.]\d{2}(?::\d{2})?(?:\.\d+)?)(?:\])?'
        r'(?:\s*-\s*(?:\[)?\b(\d{1,2}[:.]\d{2}(?::\d{2})?(?:\.\d+)?)(?:\])?)?\s*$'
    )
    
    for idx, line in enumerate(lyric_lines):
        match = pattern.search(line)
        if match:
            start_str = match.group(1)
            end_str = match.group(2)
            
            start_sec = parse_time_to_seconds(start_str)
            end_sec = parse_time_to_seconds(end_str) if end_str else None
            
            if start_sec is not None:
                forced_times[idx] = (start_sec, end_sec)
                line = line[:match.start()].strip()
        
        clean_lines.append(line)
        
    return clean_lines, forced_times


def enforce_monotonic_timing(
    lines: list[TimedLyricLine],
    forced_times: dict[int, tuple[float, float | None]] | None = None
) -> list[TimedLyricLine]:
    forced_times = forced_times or {}
    
    # Backward pass to prevent lines overlapping into forced anchors
    for i in range(len(lines) - 2, -1, -1):
        if (i + 1) in forced_times:
            next_start = forced_times[i + 1][0]
            if lines[i].end > next_start:
                lines[i] = TimedLyricLine(
                    index=lines[i].index,
                    start=min(lines[i].start, max(0.0, next_start - 0.1)),
                    end=next_start,
                    text=lines[i].text
                )

    fixed = []
    previous_end = 0.0

    for idx, line in enumerate(lines):
        if idx in forced_times:
            start = forced_times[idx][0]
            end = forced_times[idx][1] if forced_times[idx][1] is not None else max(line.end, start + 0.4)
        else:
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
