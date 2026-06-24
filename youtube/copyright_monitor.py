"""
Background Copyright Monitor Service.
Continuously tracks all uploaded videos and auto-deletes any that get copyright strikes.
This protects the YouTube account from accumulating copyright violations.
"""

import asyncio
import json
from pathlib import Path
from datetime import datetime
from typing import Optional

from googleapiclient.errors import HttpError

from utils.logger import get_logger

logger = get_logger("youtube.copyright_monitor")

# File to track all uploaded video IDs
TRACKING_FILE = Path("uploaded_videos.json")

# How often to check all videos (in seconds)
CHECK_INTERVAL = 300  # every 5 minutes


def _load_tracked_videos() -> dict:
    """Load tracked videos from the JSON file."""
    if TRACKING_FILE.exists():
        try:
            with open(TRACKING_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def _save_tracked_videos(videos: dict):
    """Save tracked videos to the JSON file."""
    with open(TRACKING_FILE, "w", encoding="utf-8") as f:
        json.dump(videos, f, indent=2, ensure_ascii=False)


def track_video(video_id: str, title: str):
    """
    Add a video to the tracking list.
    Called after every successful upload.
    """
    videos = _load_tracked_videos()
    videos[video_id] = {
        "title": title,
        "uploaded_at": datetime.now().isoformat(),
        "status": "active",
    }
    _save_tracked_videos(videos)
    logger.info(f"📋 Tracking video: {video_id} — '{title}'")


def untrack_video(video_id: str):
    """Remove a video from the tracking list."""
    videos = _load_tracked_videos()
    if video_id in videos:
        del videos[video_id]
        _save_tracked_videos(videos)


async def _check_single_video(youtube_service, video_id: str) -> Optional[str]:
    """
    Check a single video for copyright issues.
    
    Returns:
        None if clean, or a string describing the issue if there's a problem.
    """
    loop = asyncio.get_event_loop()

    def _fetch():
        return youtube_service.videos().list(
            part="status,contentDetails",
            id=video_id,
        ).execute()

    try:
        response = await loop.run_in_executor(None, _fetch)
        items = response.get("items", [])

        if not items:
            # Video was already deleted or doesn't exist
            return "deleted_externally"

        video = items[0]
        status = video.get("status", {})
        upload_status = status.get("uploadStatus", "")
        rejection_reason = status.get("rejectionReason", "")

        # Check for copyright block/rejection
        if upload_status == "rejected":
            return f"Rejected: {rejection_reason}"

        if rejection_reason:
            return f"Copyright issue: {rejection_reason}"

        # Check if the video has a "blocked" or copyright-related privacy issue
        privacy_status = status.get("privacyStatus", "")
        if upload_status == "failed":
            failure_reason = status.get("failureReason", "Unknown")
            return f"Failed: {failure_reason}"

        return None  # Video is clean

    except HttpError as e:
        if e.resp.status == 404:
            return "deleted_externally"
        logger.error(f"API error checking video {video_id}: {e}")
        return None  # Don't delete on API errors


async def _delete_video(youtube_service, video_id: str) -> bool:
    """Delete a video from YouTube."""
    loop = asyncio.get_event_loop()

    def _do_delete():
        youtube_service.videos().delete(id=video_id).execute()

    try:
        await loop.run_in_executor(None, _do_delete)
        logger.info(f"🗑️ Auto-deleted video {video_id}")
        return True
    except HttpError as e:
        logger.error(f"Failed to delete video {video_id}: {e}")
        return False


async def monitor_loop(service_pool):
    """
    Background loop that continuously checks all tracked videos
    for copyright issues and auto-deletes flagged ones.
    """
    logger.info("🛡️ Copyright Monitor started — checking every "
                f"{CHECK_INTERVAL}s")

    while True:
        try:
            await asyncio.sleep(CHECK_INTERVAL)

            videos = _load_tracked_videos()
            if not videos:
                continue

            active_videos = {
                vid: info for vid, info in videos.items()
                if info.get("status") == "active"
            }

            if not active_videos:
                continue

            logger.info(f"🔍 Scanning {len(active_videos)} tracked videos...")

            for video_id, info in active_videos.items():
                title = info.get("title", "Unknown")
                issue = "deleted_externally"
                correct_service = None

                for svc in service_pool.services:
                    svc_issue = await _check_single_video(svc, video_id)
                    if svc_issue != "deleted_externally":
                        issue = svc_issue
                        correct_service = svc
                        break

                if issue == "deleted_externally":
                    # Video was deleted outside the bot, stop tracking
                    logger.info(f"📌 Video {video_id} ('{title}') no longer exists, removing from tracker.")
                    untrack_video(video_id)

                elif issue:
                    # Copyright issue detected — auto-delete!
                    logger.warning(f"🚨 COPYRIGHT ISSUE on '{title}' ({video_id}): {issue}")
                    logger.warning(f"🗑️ Auto-deleting to protect your account...")

                    deleted = await _delete_video(correct_service, video_id)
                    if deleted:
                        # Update tracking status
                        videos[video_id]["status"] = "deleted_copyright"
                        videos[video_id]["deleted_at"] = datetime.now().isoformat()
                        videos[video_id]["reason"] = issue
                        _save_tracked_videos(videos)
                        logger.info(f"✅ Video '{title}' deleted and logged.")
                    else:
                        logger.error(f"❌ Failed to delete '{title}'. Manual action needed!")

                # Small delay between checks to avoid API rate limits
                await asyncio.sleep(2)

            logger.debug(f"✅ Scan complete. Next check in {CHECK_INTERVAL}s.")

        except asyncio.CancelledError:
            logger.info("🛑 Copyright Monitor stopped.")
            break
        except Exception as e:
            logger.error(f"Error in copyright monitor: {e}", exc_info=True)
            await asyncio.sleep(60)  # Wait a minute before retrying
