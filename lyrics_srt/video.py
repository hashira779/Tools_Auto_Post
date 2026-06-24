"""Optional MP4 lyric video creation."""

from __future__ import annotations

import asyncio
import subprocess
from pathlib import Path

from lyrics_srt.errors import SrtGenerationFailed
from lyrics_srt.ffmpeg import ensure_ffmpeg


async def create_lyric_video(
    audio_path: Path,
    srt_path: Path,
    background_path: Path,
    output_path: Path,
) -> Path:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        _create_lyric_video_sync,
        audio_path,
        srt_path,
        background_path,
        output_path,
    )


def _create_lyric_video_sync(
    audio_path: Path,
    srt_path: Path,
    background_path: Path,
    output_path: Path,
) -> Path:
    ffmpeg = ensure_ffmpeg()
    work_dir = output_path.parent

    for required in (audio_path, srt_path, background_path):
        if not required.exists():
            raise SrtGenerationFailed(f"Missing file for MP4 creation: {required.name}")

    subtitle_filter = (
        "subtitles=song.srt:charenc=UTF-8:"
        "force_style='FontName=Noto Sans Khmer,FontSize=42,"
        "PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,"
        "BorderStyle=1,Outline=2,Shadow=1,Alignment=2,MarginV=70'"
    )
    video_filter = (
        "scale=1280:720:force_original_aspect_ratio=increase,"
        "crop=1280:720,"
        f"{subtitle_filter}"
    )

    command = [
        ffmpeg,
        "-y",
        "-loop",
        "1",
        "-i",
        background_path.name,
        "-i",
        audio_path.name,
        "-vf",
        video_filter,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-tune",
        "stillimage",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-pix_fmt",
        "yuv420p",
        "-shortest",
        output_path.name,
    ]

    result = subprocess.run(
        command,
        cwd=work_dir,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        raise SrtGenerationFailed(f"FFmpeg lyric video failed: {result.stderr[-1000:]}")

    return output_path

