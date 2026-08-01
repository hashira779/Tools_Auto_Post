"""
API routes for media fetching and downloading.
"""

import asyncio
import logging

from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse

from app.models.schemas import FetchRequest, FetchResponse, DownloadRequest
from app.services.platform import detect_platform, get_platform_name
from app.services.ytdlp_service import (
    fetch_info, extract_formats, format_duration,
    download_file, cleanup_session, build_filename,
)

logger = logging.getLogger("savemedia.routes")

router = APIRouter(prefix="/api", tags=["media"])


@router.post("/fetch", response_model=FetchResponse)
async def api_fetch(req: FetchRequest, request: Request):
    """Extract video metadata and available format options."""
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    platform = detect_platform(url)
    if not platform:
        raise HTTPException(
            status_code=400,
            detail="Unsupported platform. We support YouTube, TikTok, Douyin, Instagram, and Facebook.",
        )

    try:
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, fetch_info, url)
    except Exception as e:
        logger.error(f"Fetch failed for {url}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch video info: {str(e)}")

    if not info:
        raise HTTPException(status_code=404, detail="Could not extract video information")

    video_formats, audio_formats = extract_formats(info)
    duration = info.get("duration")

    return FetchResponse(
        title=info.get("title", "Untitled Video"),
        thumbnail=info.get("thumbnail"),
        duration=int(duration) if duration else None,
        duration_str=format_duration(int(duration) if duration else None),
        platform=platform,
        platform_name=get_platform_name(platform),
        video_formats=video_formats,
        audio_formats=audio_formats,
    )


from app.celery_worker import download_media_task

@router.post("/download")
async def api_download(req: DownloadRequest, request: Request):
    """Trigger background media download and return task ID."""
    url = req.url.strip()
    platform = detect_platform(url)
    if not platform:
        raise HTTPException(status_code=400, detail="Unsupported platform")

    # Send to Celery worker
    task = download_media_task.delay(url, req.format_type, req.quality)
    return {"task_id": task.id, "status": "PENDING"}


@router.get("/download/status/{task_id}")
async def api_download_status(task_id: str):
    """Check the status of a download task."""
    task = download_media_task.AsyncResult(task_id)
    if task.state == 'PENDING':
        return {"status": "PENDING"}
    elif task.state == 'PROGRESS':
        return {"status": "PROGRESS"}
    elif task.state == 'SUCCESS':
        return {"status": "SUCCESS"}
    elif task.state == 'FAILURE':
        return {"status": "FAILURE", "error": str(task.info)}
    return {"status": task.state}


@router.get("/download/file/{task_id}")
async def api_download_file(task_id: str, background_tasks: BackgroundTasks):
    """Retrieve the downloaded file after task SUCCESS."""
    task = download_media_task.AsyncResult(task_id)
    if task.state != 'SUCCESS':
        raise HTTPException(status_code=400, detail="Task not completed successfully")

    result = task.result
    filepath = result.get("filepath")
    filename = result.get("filename")
    media_type = result.get("media_type")

    # Schedule cleanup 60s after response is sent
    from pathlib import Path
    import os
    if filepath and os.path.exists(filepath):
        background_tasks.add_task(_delayed_cleanup, Path(filepath).parent)
        return FileResponse(path=filepath, filename=filename, media_type=media_type)
    else:
        raise HTTPException(status_code=404, detail="File no longer exists")
    # This code was replaced by Celery endpoints


async def _delayed_cleanup(session_dir):
    """Wait then clean up download session."""
    await asyncio.sleep(60)
    cleanup_session(session_dir)


@router.get("/health")
async def health_check():
    """Health check endpoint for Docker / load balancers."""
    return {"status": "ok", "service": "savemedia-api"}
