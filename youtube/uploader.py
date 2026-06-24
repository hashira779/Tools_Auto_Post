"""
YouTube video upload logic.
Handles resumable uploads with progress tracking.
"""

import asyncio
import os
from dataclasses import dataclass
from typing import Optional
import httplib2

from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

from utils.logger import get_logger

logger = get_logger("youtube.uploader")

# Maximum retries for resumable upload
MAX_RETRIES = 3

# Retry-able HTTP status codes
RETRIABLE_STATUS_CODES = [500, 502, 503, 504]


@dataclass
class UploadResult:
    """Result of a YouTube upload."""
    success: bool
    video_id: Optional[str] = None
    video_url: Optional[str] = None
    error_message: Optional[str] = None


def _sync_upload(
    youtube_service,
    filepath: str,
    title: str,
    description: str,
    tags: list[str],
    category_id: str = "22",
    privacy_status: str = "private",
    thumbnail_path: Optional[str] = None,
) -> UploadResult:
    """
    Synchronous YouTube upload using resumable upload.

    Args:
        youtube_service: Authenticated YouTube API service
        filepath: Path to the video file
        title: Video title
        description: Video description
        tags: List of video tags
        category_id: YouTube category ID (22 = People & Blogs)
        privacy_status: Initial privacy (private/public/unlisted)
        thumbnail_path: Optional path to custom thumbnail

    Returns:
        UploadResult with video ID and URL
    """
    if not os.path.exists(filepath):
        return UploadResult(
            success=False,
            error_message=f"Video file not found: {filepath}",
        )

    # Build the request body
    body = {
        "snippet": {
            "title": title[:100],  # YouTube max title length
            "description": description[:5000],  # YouTube max description length
            "tags": tags[:500],  # YouTube max tags
            "categoryId": category_id,
        },
        "status": {
            "privacyStatus": privacy_status,
            "selfDeclaredMadeForKids": False,
        },
    }

    # Create the media upload object (resumable)
    media = MediaFileUpload(
        filepath,
        mimetype="video/mp4",
        resumable=True,
        chunksize=10 * 1024 * 1024,  # 10 MB chunks
    )

    try:
        logger.info(f"📤 Starting upload: '{title}'")
        logger.info(f"   File: {filepath} ({os.path.getsize(filepath) / (1024*1024):.1f} MB)")
        logger.info(f"   Privacy: {privacy_status}")

        # Create the insert request
        request = youtube_service.videos().insert(
            part="snippet,status",
            body=body,
            media_body=media,
        )

        # Execute with resumable upload (handles chunks)
        response = None
        retry_count = 0

        import time
        import random
        import socket
        import http.client
        import ssl
        
        RETRIABLE_EXCEPTIONS = (
            httplib2.HttpLib2Error,
            IOError,
            http.client.NotConnected,
            http.client.IncompleteRead,
            http.client.ImproperConnectionState,
            http.client.BadStatusLine,
            http.client.CannotSendRequest,
            http.client.CannotSendHeader,
            http.client.ResponseNotReady,
            http.client.BadStatusLine,
            ssl.SSLError,
            socket.error,
        )

        while response is None:
            try:
                status, response = request.next_chunk()
                if status:
                    progress = int(status.progress() * 100)
                    logger.info(f"   Upload progress: {progress}%")
            except HttpError as e:
                if e.resp.status in RETRIABLE_STATUS_CODES and retry_count < MAX_RETRIES:
                    retry_count += 1
                    logger.warning(f"   Retryable HTTP error ({e.resp.status}), attempt {retry_count}/{MAX_RETRIES}")
                    time.sleep(random.uniform(1, 2 ** retry_count))
                    continue
                else:
                    raise
            except RETRIABLE_EXCEPTIONS as e:
                if retry_count < MAX_RETRIES:
                    retry_count += 1
                    logger.warning(f"   Retryable network error ({type(e).__name__}: {str(e)}), attempt {retry_count}/{MAX_RETRIES}")
                    time.sleep(random.uniform(1, 2 ** retry_count))
                    continue
                else:
                    raise

        video_id = response.get("id")
        video_url = f"https://www.youtube.com/watch?v={video_id}"

        logger.info(f"✅ Upload complete! Video ID: {video_id}")
        logger.info(f"   URL: {video_url}")

        # Set custom thumbnail if provided
        if thumbnail_path and os.path.exists(thumbnail_path):
            try:
                _set_thumbnail(youtube_service, video_id, thumbnail_path)
            except Exception as e:
                logger.warning(f"   Failed to set thumbnail: {e}")

        return UploadResult(
            success=True,
            video_id=video_id,
            video_url=video_url,
        )

    except HttpError as e:
        error_msg = f"YouTube API error: {e.resp.status} - {e.content.decode()}"
        logger.error(f"❌ {error_msg}")
        return UploadResult(success=False, error_message=error_msg)

    except Exception as e:
        error_msg = f"Upload failed: {str(e)}"
        logger.error(f"❌ {error_msg}", exc_info=True)
        return UploadResult(success=False, error_message=error_msg)


def _set_thumbnail(youtube_service, video_id: str, thumbnail_path: str):
    """Set a custom thumbnail for an uploaded video."""
    media = MediaFileUpload(thumbnail_path, mimetype="image/jpeg")
    youtube_service.thumbnails().set(
        videoId=video_id,
        media_body=media,
    ).execute()
    logger.info(f"   🖼️ Custom thumbnail set for video {video_id}")


async def upload_video(
    youtube_service,
    filepath: str,
    title: str,
    description: str,
    tags: list[str],
    category_id: str = "22",
    privacy_status: str = "private",
    thumbnail_path: Optional[str] = None,
) -> UploadResult:
    """
    Upload a video to YouTube asynchronously.

    Wraps the synchronous upload in an executor for non-blocking operation.
    """
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        _sync_upload,
        youtube_service,
        filepath,
        title,
        description,
        tags,
        category_id,
        privacy_status,
        thumbnail_path,
    )
    return result


async def update_privacy(
    youtube_service,
    video_id: str,
    privacy_status: str = "public",
) -> bool:
    """
    Update the privacy status of an uploaded video.

    Args:
        youtube_service: Authenticated YouTube API service
        video_id: YouTube video ID
        privacy_status: New privacy status (public/private/unlisted)

    Returns:
        True if successful
    """
    try:
        loop = asyncio.get_event_loop()

        def _update():
            youtube_service.videos().update(
                part="status",
                body={
                    "id": video_id,
                    "status": {
                        "privacyStatus": privacy_status,
                    },
                },
            ).execute()

        await loop.run_in_executor(None, _update)
        logger.info(f"🔓 Video {video_id} privacy updated to: {privacy_status}")
        return True

    except HttpError as e:
        logger.error(f"Failed to update privacy for {video_id}: {e}")
        return False


async def delete_video(youtube_service, video_id: str) -> bool:
    """
    Delete a YouTube video.

    Args:
        youtube_service: Authenticated YouTube API service
        video_id: YouTube video ID

    Returns:
        True if successful
    """
    try:
        loop = asyncio.get_event_loop()

        def _delete():
            youtube_service.videos().delete(id=video_id).execute()

        await loop.run_in_executor(None, _delete)
        logger.info(f"🗑️ Video {video_id} deleted successfully.")
        return True

    except HttpError as e:
        logger.error(f"Failed to delete video {video_id}: {e}")
        return False
