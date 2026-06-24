"""Download YouTube audio as MP3 using yt-dlp."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

import yt_dlp

from lyrics_srt.errors import AudioTooLong, DownloadFailed, InvalidYouTubeLink
from lyrics_srt.ffmpeg import ensure_ffmpeg


YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
}


@dataclass(frozen=True)
class AudioDownloadResult:
    audio_path: Path
    title: str
    duration: float


def is_youtube_url(value: str) -> bool:
    """Return True when value is a supported YouTube URL."""

    try:
        parsed = urlparse(value.strip())
    except ValueError:
        return False

    if parsed.scheme not in {"http", "https"}:
        return False

    host = parsed.netloc.lower().split("@")[-1].split(":")[0]
    return host in YOUTUBE_HOSTS or host.endswith(".youtube.com")


async def download_youtube_audio(
    url: str,
    work_dir: Path,
    max_duration_seconds: int,
    quality: str = "192",
) -> AudioDownloadResult:
    """Download a YouTube URL to `audio.mp3` in a worker thread."""

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        _download_youtube_audio_sync,
        url,
        work_dir,
        max_duration_seconds,
        quality,
    )


def _download_youtube_audio_sync(
    url: str,
    work_dir: Path,
    max_duration_seconds: int,
    quality: str = "192",
) -> AudioDownloadResult:
    if not is_youtube_url(url):
        raise InvalidYouTubeLink()

    work_dir.mkdir(parents=True, exist_ok=True)
    ffmpeg_path = ensure_ffmpeg()

    probe_opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "skip_download": True,
        "extract_flat": False,
    }

    try:
        with yt_dlp.YoutubeDL(probe_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as exc:
        raise DownloadFailed(f"Download failed while reading video info: {exc}") from exc

    duration = float(info.get("duration") or 0)
    if duration and duration > max_duration_seconds:
        raise AudioTooLong(
            f"Audio too long ({duration:.0f}s > {max_duration_seconds}s)."
        )

    outtmpl = str(work_dir / "audio.%(ext)s")
    download_opts = {
        "format": "bestaudio/best",
        "outtmpl": outtmpl,
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "ffmpeg_location": ffmpeg_path,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": quality,
            }
        ],
    }

    try:
        with yt_dlp.YoutubeDL(download_opts) as ydl:
            downloaded_info = ydl.extract_info(url, download=True)
    except Exception as exc:
        raise DownloadFailed(f"Download failed: {exc}") from exc

    mp3_path = work_dir / "audio.mp3"
    if not mp3_path.exists():
        matches = list(work_dir.glob("audio*.mp3"))
        if matches:
            mp3_path = matches[0]

    if not mp3_path.exists():
        raise DownloadFailed("Download finished but MP3 output was not created.")

    title = downloaded_info.get("title") or info.get("title") or "YouTube song"
    final_duration = float(downloaded_info.get("duration") or duration or 0)

    if final_duration and final_duration > max_duration_seconds:
        raise AudioTooLong(
            f"Audio too long ({final_duration:.0f}s > {max_duration_seconds}s)."
        )

    return AudioDownloadResult(
        audio_path=mp3_path,
        title=title,
        duration=final_duration,
    )

