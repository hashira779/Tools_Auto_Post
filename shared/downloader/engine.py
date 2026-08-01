"""
Video download engine using yt-dlp.
Handles downloading videos from TikTok and RedNote in the best available quality.
"""

import asyncio
import os
import json
import re
import time
import subprocess
import requests
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Callable, Awaitable

import yt_dlp

from utils.logger import get_logger

logger = get_logger("downloader")


@dataclass
class DownloadResult:
    """Result of a video download."""
    success: bool
    filepath: Optional[str] = None
    thumbnail_path: Optional[str] = None
    info_dict: dict = field(default_factory=dict)
    error_message: Optional[str] = None
    filesize_mb: float = 0.0


class VideoDownloader:
    """Downloads videos from TikTok and RedNote using yt-dlp."""

    def __init__(self, download_dir: str = "./downloads"):
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(parents=True, exist_ok=True)

    def _get_ydl_opts(self, progress_hook: Optional[Callable] = None) -> dict:
        """Build yt-dlp options for best quality download."""
        opts = {
            # Request the best video up to 4K + best audio, merged into mp4
            'format': 'bestvideo[height<=2160]+bestaudio/bestvideo+bestaudio/best',
            'merge_output_format': 'mp4',
            'outtmpl': str(self.download_dir / '%(id)s.%(ext)s'),

            # Metadata
            'writeinfojson': True,
            'writethumbnail': True,

            # Post-processing
            'postprocessors': [
                {
                    'key': 'FFmpegVideoConvertor',
                    'preferedformat': 'mp4',
                },
                {
                    'key': 'FFmpegThumbnailsConvertor',
                    'format': 'jpg',
                },
            ],

            # Network & reliability
            'retries': 3,
            'fragment_retries': 3,
            'http_headers': {
                'User-Agent': (
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) '
                    'Chrome/120.0.0.0 Safari/537.36'
                ),
            },

            # Quiet mode (we handle our own logging)
            'quiet': True,
            'no_warnings': True,

            # Embed metadata
            'addmetadata': True,
        }

        # Use cookies.txt if it exists in the root directory
        if os.path.exists("cookies.txt"):
            opts['cookiefile'] = "cookies.txt"

        if progress_hook:
            opts['progress_hooks'] = [progress_hook]

        return opts

    def _sync_download(
        self,
        url: str,
        progress_hook: Optional[Callable] = None,
    ) -> DownloadResult:
        """Synchronous download (runs in executor for async usage)."""
        url_lower = url.lower()
        if "douyin.com" in url_lower or "tiktok.com" in url_lower:
            try:
                res = self._sync_download_savetik(url)
                if res.success:
                    return res
                logger.warning("Savetik bypass failed, falling back to yt-dlp...")
            except Exception as e:
                logger.warning(f"Savetik bypass error, falling back to yt-dlp: {e}")
            
        opts = self._get_ydl_opts(progress_hook)

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                logger.info(f"Starting download: {url}")

                # Extract info first (without downloading) to get metadata
                info = ydl.extract_info(url, download=True)

                if info is None:
                    return DownloadResult(
                        success=False,
                        error_message="Failed to extract video information.",
                    )

                # Find the downloaded file
                video_id = info.get('id', 'unknown')
                video_ext = info.get('ext', 'mp4')
                filepath = str(self.download_dir / f"{video_id}.{video_ext}")

                # Also check for mp4 version (after conversion)
                mp4_path = str(self.download_dir / f"{video_id}.mp4")
                if os.path.exists(mp4_path):
                    filepath = mp4_path
                elif not os.path.exists(filepath):
                    # Search for any file with the video_id
                    for f in self.download_dir.iterdir():
                        if f.stem == video_id and f.suffix in ('.mp4', '.mkv', '.webm'):
                            filepath = str(f)
                            break

                if not os.path.exists(filepath):
                    return DownloadResult(
                        success=False,
                        error_message=f"Download completed but file not found: {filepath}",
                        info_dict=info,
                    )

                # Find thumbnail
                thumbnail_path = None
                for ext in ['jpg', 'png', 'webp']:
                    thumb = self.download_dir / f"{video_id}.{ext}"
                    if thumb.exists():
                        thumbnail_path = str(thumb)
                        break

                # Calculate file size
                filesize_mb = os.path.getsize(filepath) / (1024 * 1024)

                logger.info(f"Download complete: {filepath} ({filesize_mb:.1f} MB)")

                return DownloadResult(
                    success=True,
                    filepath=filepath,
                    thumbnail_path=thumbnail_path,
                    info_dict=info,
                    filesize_mb=filesize_mb,
                )

        except yt_dlp.utils.DownloadError as e:
            error_msg = str(e)
            logger.error(f"Download error: {error_msg}")
            return DownloadResult(
                success=False,
                error_message=f"Download failed: {error_msg}",
            )
        except Exception as e:
            logger.error(f"Unexpected error during download: {e}", exc_info=True)
            return DownloadResult(
                success=False,
                error_message=f"Unexpected error: {str(e)}",
            )

    async def download(
        self,
        url: str,
        progress_callback: Optional[Callable[[str], Awaitable[None]]] = None,
    ) -> DownloadResult:
        """
        Download a video asynchronously.

        Args:
            url: Video URL to download
            progress_callback: Async callback for progress updates

        Returns:
            DownloadResult with file path and metadata
        """
        last_status = {"percent": ""}

        def progress_hook(d):
            """yt-dlp progress hook (sync)."""
            if d['status'] == 'downloading':
                percent = d.get('_percent_str', '?%').strip()
                if percent != last_status["percent"]:
                    last_status["percent"] = percent
                    logger.debug(f"Downloading: {percent}")
            elif d['status'] == 'finished':
                logger.info("Download finished, post-processing...")

        # Run the synchronous download in a thread executor
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            self._sync_download,
            url,
            progress_hook,
        )

        return result

    def _sync_download_savetik(self, url: str) -> DownloadResult:
        """Fallback for Douyin and TikTok using savetik.co API"""
        logger.info(f"Using Savetik bypass for {url}")
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            html = None
            for attempt in range(3):
                try:
                    r = requests.post('https://savetik.co/api/ajaxSearch', data={'q': url, 'vt': 'home'}, headers=headers, timeout=30)
                    r.raise_for_status()
                    html = r.json().get('data', '')
                    break
                except requests.exceptions.Timeout:
                    logger.warning(f"Savetik API timeout (attempt {attempt + 1}/3)")
                    if attempt == 2:
                        raise
            if not html:
                return DownloadResult(success=False, error_message="Savetik API returned empty data.")
            
            # Extract Title & Tags
            title_match = re.search(r'<h3>(.*?)</h3>', html)
            title = title_match.group(1).strip() if title_match else 'Douyin Video'
            tags = re.findall(r'#(\w+)', title)
            
            # Extract Duration
            duration = 0
            duration_match = re.search(r'<p>(\d+):(\d+)</p>', html)
            if duration_match:
                m, s = int(duration_match.group(1)), int(duration_match.group(2))
                duration = m * 60 + s
                
            # Extract DL URL
            hd_match = re.search(r'href="([^"]*snapcdn\.app[^"]*)"[^>]*>.*?(?:Download MP4 HD|Download MP4 \[1\]).*?</a>', html, re.IGNORECASE)
            if not hd_match:
                return DownloadResult(success=False, error_message="Could not find download link from Savetik bypass.")
            dl_url = hd_match.group(1)
            
            # Download file
            video_id = f"douyin_{int(time.time())}"
            filepath = str(self.download_dir / f"{video_id}.mp4")
            
            logger.info(f"Downloading MP4 directly from Savetik: {dl_url[:50]}...")
            with requests.get(dl_url, stream=True, timeout=120) as r_dl:
                r_dl.raise_for_status()
                with open(filepath, 'wb') as f:
                    for chunk in r_dl.iter_content(chunk_size=65536):
                        f.write(chunk)
            
            # FFprobe to get resolution
            height = 0
            try:
                probe_cmd = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=height', '-of', 'json', filepath]
                result = subprocess.run(probe_cmd, capture_output=True, text=True)
                if result.returncode == 0:
                    probe_data = json.loads(result.stdout)
                    if 'streams' in probe_data and len(probe_data['streams']) > 0:
                        height = probe_data['streams'][0].get('height', 0)
            except Exception as e:
                logger.error(f"FFprobe failed: {e}")
                
            filesize_mb = os.path.getsize(filepath) / (1024 * 1024)
            
            info = {
                'id': video_id,
                'title': title,
                'description': title,
                'uploader': 'Douyin Creator',
                'duration': duration,
                'tags': tags,
                'height': height,
                'ext': 'mp4'
            }
            
            return DownloadResult(
                success=True,
                filepath=filepath,
                info_dict=info,
                filesize_mb=filesize_mb
            )
            
        except Exception as e:
            logger.exception("Savetik bypass failed")
            return DownloadResult(success=False, error_message=f"Savetik bypass failed: {e}")

    def cleanup(self, filepath: str):
        """Remove a downloaded file and its associated metadata files."""
        path = Path(filepath)
        video_id = path.stem

        # Remove the video file
        if path.exists():
            path.unlink()
            logger.debug(f"Removed: {path}")

        # Remove associated files (info json, thumbnail, etc.)
        for f in self.download_dir.iterdir():
            if f.stem == video_id or f.stem.startswith(f"{video_id}."):
                f.unlink()
                logger.debug(f"Removed: {f}")

    def cleanup_all(self):
        """Remove all files from the download directory."""
        for f in self.download_dir.iterdir():
            if f.is_file():
                f.unlink()
        logger.info("Cleaned up all downloaded files.")
