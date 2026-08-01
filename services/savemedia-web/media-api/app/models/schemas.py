# ── Pydantic Models ──────────────────────────────────────────────

from typing import Optional
from pydantic import BaseModel


class FetchRequest(BaseModel):
    """Request body for /api/fetch endpoint."""
    url: str


class FormatInfo(BaseModel):
    """A single downloadable format option."""
    format_id: str
    label: str
    ext: str
    filesize_approx: Optional[float] = None  # MB
    quality: str  # e.g. "1080p", "720p", "320kbps"


class FetchResponse(BaseModel):
    """Response body for /api/fetch endpoint."""
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    duration_str: Optional[str] = None
    platform: str
    platform_name: str
    video_formats: list[FormatInfo] = []
    audio_formats: list[FormatInfo] = []


class DownloadRequest(BaseModel):
    """Request body for /api/download endpoint."""
    url: str
    format_type: str   # "video" | "audio"
    quality: str        # format_id or quality label
