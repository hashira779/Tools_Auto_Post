"""
Post-upload copyright status checking.
Polls YouTube API to check if the uploaded video has copyright claims.
"""

import asyncio
from dataclasses import dataclass, field
from typing import Optional

from googleapiclient.errors import HttpError

from utils.logger import get_logger

logger = get_logger("youtube.copyright")


@dataclass
class CopyrightResult:
    """Result of a copyright check."""
    is_clean: bool
    status: str  # "clean", "claimed", "blocked", "processing", "error"
    claims: list[str] = field(default_factory=list)
    details: str = ""


async def check_copyright_status(
    youtube_service,
    video_id: str,
    timeout_seconds: int = 300,
    poll_interval: int = 15,
) -> CopyrightResult:
    """
    Poll YouTube to check the copyright status of an uploaded video.

    YouTube performs automatic Content ID checks after upload. This function
    polls the video status until the checks complete or timeout.

    Args:
        youtube_service: Authenticated YouTube API service
        video_id: YouTube video ID to check
        timeout_seconds: Maximum seconds to wait (default: 5 minutes)
        poll_interval: Seconds between status checks (default: 15)

    Returns:
        CopyrightResult indicating whether the video is clean
    """
    elapsed = 0
    logger.info(f"🛡️ Starting copyright check for video: {video_id}")
    logger.info(f"   Timeout: {timeout_seconds}s, Poll interval: {poll_interval}s")

    while elapsed < timeout_seconds:
        try:
            result = await _poll_video_status(youtube_service, video_id)

            if result.status == "processing":
                logger.debug(f"   Still processing... ({elapsed}s elapsed)")
                await asyncio.sleep(poll_interval)
                elapsed += poll_interval
                continue

            # Got a definitive result
            return result

        except Exception as e:
            logger.error(f"Error checking copyright status: {e}")
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

    # Timeout reached — assume it's still processing
    logger.warning(f"⏰ Copyright check timed out after {timeout_seconds}s")
    return CopyrightResult(
        is_clean=False,
        status="processing",
        details=f"YouTube checks did not complete within {timeout_seconds}s. "
                "The video is kept as private. Check YouTube Studio manually.",
    )


async def _poll_video_status(
    youtube_service,
    video_id: str,
) -> CopyrightResult:
    """
    Query YouTube API for the current video status.

    Uses videos.list with 'status' and 'contentDetails' parts.
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
            return CopyrightResult(
                is_clean=False,
                status="error",
                details=f"Video {video_id} not found via API.",
            )

        video = items[0]
        status = video.get("status", {})
        upload_status = status.get("uploadStatus", "")

        # Check upload status first
        if upload_status == "uploaded":
            # Video is still being processed by YouTube
            return CopyrightResult(
                is_clean=False,
                status="processing",
                details="Video is still being processed.",
            )

        if upload_status == "processed":
            # Video processing is complete — check for claims
            # Note: The public API doesn't directly expose Content ID claims.
            # We check for rejection or failure status as indicators.

            rejection_reason = status.get("rejectionReason", "")
            failure_reason = status.get("failureReason", "")

            if rejection_reason:
                claims = [f"Rejection reason: {rejection_reason}"]
                logger.warning(f"⚠️ Video rejected: {rejection_reason}")
                return CopyrightResult(
                    is_clean=False,
                    status="blocked",
                    claims=claims,
                    details=f"Video was rejected by YouTube: {rejection_reason}",
                )

            if failure_reason:
                logger.warning(f"⚠️ Video processing failed: {failure_reason}")
                return CopyrightResult(
                    is_clean=False,
                    status="error",
                    claims=[f"Processing failure: {failure_reason}"],
                    details=f"Video processing failed: {failure_reason}",
                )

            # No rejection or failure — video appears clean
            logger.info(f"✅ Video {video_id} appears clean — no issues detected")
            return CopyrightResult(
                is_clean=True,
                status="clean",
                details="Video processed successfully. No copyright issues detected via API.",
            )

        if upload_status == "rejected":
            rejection_reason = status.get("rejectionReason", "Unknown")
            logger.warning(f"❌ Video rejected: {rejection_reason}")
            return CopyrightResult(
                is_clean=False,
                status="blocked",
                claims=[rejection_reason],
                details=f"Video was rejected: {rejection_reason}",
            )

        if upload_status == "failed":
            failure_reason = status.get("failureReason", "Unknown")
            logger.error(f"❌ Upload failed: {failure_reason}")
            return CopyrightResult(
                is_clean=False,
                status="error",
                claims=[failure_reason],
                details=f"Upload failed: {failure_reason}",
            )

        # Unknown status — treat as still processing
        logger.debug(f"   Upload status: {upload_status}")
        return CopyrightResult(
            is_clean=False,
            status="processing",
            details=f"Current upload status: {upload_status}",
        )

    except HttpError as e:
        logger.error(f"YouTube API error during copyright check: {e}")
        return CopyrightResult(
            is_clean=False,
            status="error",
            details=f"API error: {str(e)}",
        )
