import os
import time
import shutil
import uuid
import logging
from pathlib import Path
from typing import Optional, Tuple

import yt_dlp

logger = logging.getLogger("podcast.ytdlp")

DOWNLOAD_DIR = Path(os.getenv("DOWNLOAD_DIR", "/app/storage/downloads"))
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

def _base_opts() -> dict:
    """Shared yt-dlp options."""
    return {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "retries": 3,
        "extractor_retries": 3,
        "fragment_retries": 3,
        "extractor_args": {
            "youtube": ["player_client=ios,tv,web"]
        },
        "remote_components": ["ejs:github"],
    }

def download_audio(url: str, max_retries: int = 2) -> Tuple[Optional[Path], Optional[dict]]:
    """
    Downloads the best audio from the given URL and returns the local Path and info_dict.
    """
    session_id = str(uuid.uuid4())[:8]
    session_dir = DOWNLOAD_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    opts = _base_opts()
    opts["outtmpl"] = str(session_dir / "%(id)s.%(ext)s")
    # Prefer HLS/m3u8 streams (bypasses YouTube's 403 block on direct HTTPS
    # audio from server/datacenter IPs), fall back to bestaudio for other sites
    opts["format"] = "91/92/93/bestaudio/best"
    
    # Force conversion to mp3 or wav to make it easy to process
    opts["postprocessors"] = [{
        "key": "FFmpegExtractAudio",
        "preferredcodec": "mp3",
        "preferredquality": "192",
    }]

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
            logger.warning(f"download_audio attempt {attempt}/{max_retries} failed for {url}: {e}")
            if attempt < max_retries:
                time.sleep(1.0 * attempt)

    if not info:
        shutil.rmtree(session_dir, ignore_errors=True)
        if last_error:
            raise last_error
        return None, None

    # Find the downloaded file
    downloaded_file = None
    for f in session_dir.iterdir():
        if f.is_file() and f.suffix in (".mp3", ".m4a", ".wav", ".webm", ".mp4"):
            downloaded_file = f
            if f.suffix == ".mp3":
                break

    if not downloaded_file or not downloaded_file.exists():
        shutil.rmtree(session_dir, ignore_errors=True)
        return None, None

    return downloaded_file, info

def cleanup_audio(filepath: Path):
    """Remove the download directory for a given file."""
    if filepath and filepath.parent.exists() and filepath.parent != DOWNLOAD_DIR:
        shutil.rmtree(filepath.parent, ignore_errors=True)
