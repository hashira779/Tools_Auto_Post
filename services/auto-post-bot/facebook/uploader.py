"""
Facebook Page video uploader using Graph API.
Handles uploading videos to a Facebook Page with resumable uploads.
"""

import os
import time
import requests
from pathlib import Path

from utils.logger import get_logger

logger = get_logger("facebook.uploader")

# Facebook Graph API version
GRAPH_API_VERSION = "v21.0"
GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"
GRAPH_VIDEO_BASE = f"https://graph-video.facebook.com/{GRAPH_API_VERSION}"


def upload_video_to_facebook(
    filepath: str,
    title: str,
    description: str,
    page_id: str,
    page_access_token: str,
    thumbnail_path: str = None,
) -> dict:
    """
    Upload a video to a Facebook Page.

    Uses resumable upload for reliability with large files.

    Args:
        filepath: Path to the video file
        title: Video title
        description: Video description/caption
        page_id: Facebook Page ID
        page_access_token: Long-lived Page Access Token
        thumbnail_path: Optional path to thumbnail image

    Returns:
        dict with 'success', 'post_id', 'video_id', 'error' keys
    """
    if not os.path.exists(filepath):
        return {"success": False, "error": f"File not found: {filepath}"}

    file_size = os.path.getsize(filepath)
    file_size_mb = file_size / (1024 * 1024)
    logger.info(f"📘 Uploading to Facebook: {title} ({file_size_mb:.1f} MB)")

    try:
        # --- Step 1: Initialize resumable upload ---
        init_url = f"{GRAPH_VIDEO_BASE}/{page_id}/videos"
        init_params = {
            "upload_phase": "start",
            "file_size": file_size,
            "access_token": page_access_token,
        }

        logger.info("  [1/3] Initializing upload session...")
        init_resp = requests.post(init_url, data=init_params, timeout=30)
        init_resp.raise_for_status()
        init_data = init_resp.json()

        upload_session_id = init_data.get("upload_session_id")
        video_id = init_data.get("video_id")

        if not upload_session_id:
            return {"success": False, "error": f"Failed to start upload: {init_data}"}

        logger.info(f"  Session ID: {upload_session_id}, Video ID: {video_id}")

        # --- Step 2: Upload the video file ---
        transfer_url = f"{GRAPH_VIDEO_BASE}/{page_id}/videos"

        logger.info("  [2/3] Uploading video data...")
        with open(filepath, "rb") as video_file:
            transfer_params = {
                "upload_phase": "transfer",
                "upload_session_id": upload_session_id,
                "start_offset": "0",
                "access_token": page_access_token,
            }
            transfer_files = {
                "video_file_chunk": video_file,
            }
            transfer_resp = requests.post(
                transfer_url,
                data=transfer_params,
                files=transfer_files,
                timeout=600,  # 10 min timeout for large files
            )
            transfer_resp.raise_for_status()

        logger.info("  Upload transfer complete!")

        # --- Step 3: Finish the upload ---
        finish_url = f"{GRAPH_VIDEO_BASE}/{page_id}/videos"
        finish_params = {
            "upload_phase": "finish",
            "upload_session_id": upload_session_id,
            "access_token": page_access_token,
            "title": title[:255],  # FB title max length
            "description": description[:5000],  # FB description max
        }

        logger.info("  [3/3] Finalizing upload...")
        finish_resp = requests.post(finish_url, data=finish_params, timeout=60)
        finish_resp.raise_for_status()
        finish_data = finish_resp.json()

        if finish_data.get("success"):
            post_url = f"https://www.facebook.com/{page_id}/videos/{video_id}"
            logger.info(f"  ✅ Upload complete! Video ID: {video_id}")
            logger.info(f"     URL: {post_url}")

            # Optional: Set custom thumbnail
            if thumbnail_path and os.path.exists(thumbnail_path):
                try:
                    _set_thumbnail(video_id, thumbnail_path, page_access_token)
                except Exception as e:
                    logger.warning(f"  ⚠️ Failed to set thumbnail: {e}")

            return {
                "success": True,
                "video_id": video_id,
                "post_url": post_url,
            }
        else:
            return {"success": False, "error": f"Finish phase failed: {finish_data}"}

    except requests.exceptions.HTTPError as e:
        error_body = ""
        try:
            error_body = e.response.json()
        except Exception:
            error_body = e.response.text[:500]
        logger.error(f"❌ Facebook API error: {e} — {error_body}")
        return {"success": False, "error": f"HTTP {e.response.status_code}: {error_body}"}

    except Exception as e:
        logger.exception("❌ Facebook upload failed")
        return {"success": False, "error": str(e)}


def _set_thumbnail(video_id: str, thumbnail_path: str, access_token: str):
    """Set a custom thumbnail for a Facebook video."""
    url = f"{GRAPH_API_BASE}/{video_id}/thumbnails"
    with open(thumbnail_path, "rb") as thumb_file:
        resp = requests.post(
            url,
            data={"access_token": access_token, "is_preferred": "true"},
            files={"source": thumb_file},
            timeout=30,
        )
        resp.raise_for_status()
    logger.info(f"  🖼️ Custom thumbnail set for video {video_id}")


def check_page_access(page_id: str, access_token: str) -> bool:
    """Verify that the access token can post to the page."""
    try:
        url = f"{GRAPH_API_BASE}/{page_id}"
        params = {"access_token": access_token, "fields": "name,id"}
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"📘 Connected to Facebook Page: {data.get('name', 'Unknown')} (ID: {data.get('id')})")
        return True
    except Exception as e:
        logger.error(f"❌ Facebook Page access check failed: {e}")
        return False
