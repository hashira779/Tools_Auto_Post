import os
from celery import Celery
import asyncio
from pathlib import Path

from app.services.ytdlp_service import download_file, build_filename

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "savemedia_tasks",
    broker=redis_url,
    backend=redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)


@celery_app.task(bind=True)
def download_media_task(self, url: str, format_type: str, quality: str):
    """
    Background Celery task to download media using yt-dlp.
    It blocks the worker (which is fine since workers are multi-process/thread).
    """
    self.update_state(state="PROGRESS", meta={"status": "Starting download..."})
    
    def yt_progress_hook(d):
        if d['status'] == 'downloading':
            percent = d.get('_percent_str', '0%').strip()
            speed = d.get('_speed_str', '0MiB/s').strip()
            self.update_state(state="PROGRESS", meta={"status": f"Downloading {percent} ({speed})"})

    # We must run the async download_file inside an event loop
    loop = asyncio.get_event_loop()
    try:
        # Since download_file is a synchronous function that we usually run in a thread,
        # wait, let me check if download_file is async or sync.
        # In media.py it was called with run_in_executor, so it's a SYNC function!
        filepath, info = download_file(url, format_type, quality, progress_hook=yt_progress_hook)
        
        if not filepath or not info:
            raise Exception("Download failed: No file produced")
            
        expected_ext = "mp3" if format_type == "audio" else "mp4"
        filename = build_filename(info, expected_ext)
        
        return {
            "status": "COMPLETED",
            "filepath": str(filepath),
            "filename": filename,
            "media_type": "audio/mpeg" if format_type == "audio" else "video/mp4"
        }
    except Exception as e:
        self.update_state(state="FAILURE", meta={"error": str(e)})
        raise e
