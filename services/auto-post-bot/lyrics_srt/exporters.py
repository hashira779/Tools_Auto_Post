"""Write SRT, LRC, and lyrics text files."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class TimedLyricLine:
    index: int
    start: float
    end: float
    text: str


def save_lyrics_text(lyrics: str, path: Path) -> None:
    path.write_text(lyrics.strip() + "\n", encoding="utf-8")


def write_srt(lines: list[TimedLyricLine], path: Path) -> None:
    chunks = []
    for line in lines:
        chunks.append(
            "\n".join(
                [
                    str(line.index),
                    f"{format_srt_time(line.start)} --> {format_srt_time(line.end)}",
                    line.text,
                ]
            )
        )
    path.write_text("\n\n".join(chunks) + "\n", encoding="utf-8")


def write_lrc(lines: list[TimedLyricLine], path: Path) -> None:
    body = "\n".join(f"{format_lrc_time(line.start)}{line.text}" for line in lines)
    path.write_text(body + "\n", encoding="utf-8")


def format_srt_time(seconds: float) -> str:
    seconds = max(0.0, seconds)
    millis = int(round(seconds * 1000))
    hours, remainder = divmod(millis, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_lrc_time(seconds: float) -> str:
    seconds = max(0.0, seconds)
    centis = int(round(seconds * 100))
    minutes, remainder = divmod(centis, 6000)
    secs, centis = divmod(remainder, 100)
    return f"[{minutes:02d}:{secs:02d}.{centis:02d}]"

