"""Parse lyrics and extract manual timestamps."""

from __future__ import annotations

import re
from lyrics_srt.errors import MissingLyricsText
from lyrics_srt.exporters import TimedLyricLine


def split_lyrics(lyrics: str) -> list[str]:
    """Split user lyrics into non-empty subtitle lines."""
    lines = [line.strip() for line in lyrics.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    lines = [line for line in lines if line]
    if not lines:
        raise MissingLyricsText()
    return lines


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
