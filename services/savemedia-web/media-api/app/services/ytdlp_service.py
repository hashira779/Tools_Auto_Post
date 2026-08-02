"""
yt-dlp wrapper service for extracting metadata and downloading media.
"""

import os
import re
import time
import shutil
import uuid
import logging
from pathlib import Path
from typing import Optional

import yt_dlp

from app.models.schemas import FormatInfo

logger = logging.getLogger("savemedia.ytdlp")

# ── Download directory ───────────────────────────────────────────
DOWNLOAD_DIR = Path(os.getenv("DOWNLOAD_DIR", "/tmp/savemedia_downloads"))
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ── Cookies file (optional) ─────────────────────────────────────
COOKIES_FILE = os.getenv("COOKIES_FILE", "")


def _base_opts() -> dict:
    """Shared yt-dlp options."""
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "retries": 3,
        "extractor_retries": 3,
        "fragment_retries": 3,
        "retry_sleep": {"http": 1, "extractor": 1},
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
        },
    }
    if COOKIES_FILE and os.path.exists(COOKIES_FILE):
        opts["cookiefile"] = COOKIES_FILE
    return opts


# ── Format Helpers ───────────────────────────────────────────────

def format_duration(seconds: Optional[int]) -> str:
    """Convert seconds to HH:MM:SS or MM:SS string."""
    if not seconds:
        return "Unknown"
    h, remainder = divmod(seconds, 3600)
    m, s = divmod(remainder, 60)
    return f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m}:{s:02d}"


def extract_formats(info: dict) -> tuple[list[FormatInfo], list[FormatInfo]]:
    """Parse yt-dlp format list into video and audio options."""
    video_formats: list[FormatInfo] = []
    audio_formats: list[FormatInfo] = []
    seen_video: set[str] = set()
    seen_audio: set[str] = set()

    for f in info.get("formats", []):
        height = f.get("height")
        vcodec = f.get("vcodec", "none")
        acodec = f.get("acodec", "none")

        # Video format
        if height and vcodec != "none":
            label = f"{height}p"
            if label not in seen_video:
                seen_video.add(label)
                filesize = f.get("filesize") or f.get("filesize_approx")
                filesize_mb = round(filesize / (1024 * 1024), 1) if filesize else None
                video_formats.append(FormatInfo(
                    format_id=f.get("format_id", ""),
                    label=label, ext="mp4",
                    filesize_approx=filesize_mb, quality=label,
                ))

        # Audio-only format
        if acodec != "none" and vcodec == "none":
            abr = f.get("abr") or f.get("tbr")
            if abr:
                abr_int = int(abr)
                label = f"{abr_int}kbps"
                if label not in seen_audio:
                    seen_audio.add(label)
                    filesize = f.get("filesize") or f.get("filesize_approx")
                    filesize_mb = round(filesize / (1024 * 1024), 1) if filesize else None
                    audio_formats.append(FormatInfo(
                        format_id=f.get("format_id", ""),
                        label=label, ext="mp3",
                        filesize_approx=filesize_mb, quality=label,
                    ))

    # Sort highest first
    video_formats.sort(key=lambda x: int(x.quality.replace("p", "")), reverse=True)
    audio_formats.sort(key=lambda x: int(x.quality.replace("kbps", "")), reverse=True)

    # Defaults if empty
    if not video_formats:
        video_formats = [FormatInfo(format_id="best", label="Best Quality", ext="mp4", quality="best")]
    if not audio_formats:
        audio_formats = [FormatInfo(format_id="bestaudio", label="Best Quality", ext="mp3", quality="best")]

    return video_formats, audio_formats


# ── Core Operations ──────────────────────────────────────────────

def fetch_info(url: str, max_retries: int = 3, retry_delay: float = 1.0) -> Optional[dict]:
    """
    Extract video metadata without downloading.
    Includes automatic retry for transient anti-bot/challenge responses (e.g. TikTok).
    """
    opts = _base_opts()
    opts["skip_download"] = True
    
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info:
                    return info
        except Exception as e:
            last_error = e
            logger.warning(f"fetch_info attempt {attempt}/{max_retries} failed for {url}: {e}")
            if attempt < max_retries:
                time.sleep(retry_delay * attempt)

    if last_error:
        raise last_error
    return None


def download_file(url: str, format_type: str, quality: str, progress_hook=None, max_retries: int = 2) -> tuple[Optional[Path], Optional[dict]]:
    """
    Download media and return (filepath, info_dict).
    Creates a unique session directory for each download with retry support.
    """
    session_id = str(uuid.uuid4())[:8]
    session_dir = DOWNLOAD_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    opts = _base_opts()
    opts["outtmpl"] = str(session_dir / "%(id)s.%(ext)s")
    if progress_hook:
        opts["progress_hooks"] = [progress_hook]

    if format_type == "audio":
        opts["format"] = "bestaudio/best"
        opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": quality.replace("kbps", "") if "kbps" in quality else "192",
        }]
    else:
        if quality == "best":
            opts["format"] = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best"
        else:
            height = quality.replace("p", "")
            opts["format"] = (
                f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/"
                f"bestvideo[height<={height}]+bestaudio/"
                f"best[height<={height}]/best"
            )
        opts["merge_output_format"] = "mp4"

    info = None
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
                if info:
                    break
        except Exception as e:
            last_error = e
            logger.warning(f"download_file attempt {attempt}/{max_retries} failed for {url}: {e}")
            if attempt < max_retries:
                time.sleep(1.0 * attempt)

    if not info:
        shutil.rmtree(session_dir, ignore_errors=True)
        if last_error:
            raise last_error
        return None, None

    # Find the downloaded file
    expected_ext = "mp3" if format_type == "audio" else "mp4"
    downloaded_file = None
    for f in session_dir.iterdir():
        if f.is_file() and f.suffix in (f".{expected_ext}", ".mp4", ".mp3", ".webm", ".mkv"):
            downloaded_file = f
            if f.suffix == f".{expected_ext}":
                break

    if not downloaded_file or not downloaded_file.exists():
        shutil.rmtree(session_dir, ignore_errors=True)
        return None, None

    return downloaded_file, info


def cleanup_session(session_dir: Path):
    """Remove a download session directory."""
    shutil.rmtree(session_dir, ignore_errors=True)


def build_filename(info: dict, ext: str) -> str:
    """Build a safe download filename from video title."""
    title = info.get("title", "download")
    safe_title = re.sub(r'[<>:"/\\|?*]', '', title)[:80].strip()
    return f"{safe_title or 'download'}.{ext}"
