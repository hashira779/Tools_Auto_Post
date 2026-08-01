"""
URL detection and platform identification.
Parses TikTok and RedNote (Xiaohongshu) links from user messages.
"""

import re
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class Platform(Enum):
    """Supported video platforms."""
    TIKTOK = "tiktok"
    REDNOTE = "rednote"
    DOUYIN = "douyin"
    YOUTUBE = "youtube"
    UNKNOWN = "unknown"


@dataclass
class LinkInfo:
    """Parsed link information."""
    platform: Platform
    url: str
    original_text: str


# TikTok URL patterns
TIKTOK_PATTERNS = [
    r'https?://(?:www\.)?tiktok\.com/@[\w.-]+/video/\d+',   # Full video URL
    r'https?://(?:www\.)?tiktok\.com/t/\w+',                 # Short share link
    r'https?://vm\.tiktok\.com/\w+',                          # VM short link
    r'https?://vt\.tiktok\.com/\w+',                          # VT short link
    r'https?://(?:www\.)?tiktok\.com/@[\w.-]+/photo/\d+',    # Photo/slideshow
]

# RedNote (Xiaohongshu) URL patterns
REDNOTE_PATTERNS = [
    r'https?://(?:www\.)?xiaohongshu\.com/(?:explore|discovery/item)/[\w]+',  # Full URL
    r'https?://(?:www\.)?xiaohongshu\.com/user/profile/[\w]+',               # Profile
    r'https?://xhslink\.com/[\w/]+',                                         # Short link
    r'https?://(?:www\.)?rednote\.com/(?:explore|discovery/item)/[\w]+',     # rednote.com domain
    r'https?://(?:www\.)?xiaohongshu\.com/[\w/-]+',                          # Generic XHS path
]

# Combined pattern to find any URL in text
DOUYIN_PATTERNS = [
    r'https?://(?:www\.)?douyin\.com/video/\d+',   # Full video URL
    r'https?://v\.douyin\.com/[\w]+',              # Short share link
]

# YouTube URL patterns
YOUTUBE_PATTERNS = [
    r'https?://(?:www\.)?youtube\.com/watch\?v=[\w-]+',  # Standard watch URL
    r'https?://(?:www\.)?youtube\.com/shorts/[\w-]+',    # Shorts URL
    r'https?://youtu\.be/[\w-]+',                        # Short URL
]

_ALL_PATTERNS = TIKTOK_PATTERNS + REDNOTE_PATTERNS + DOUYIN_PATTERNS
_URL_GENERAL_PATTERN = re.compile(r'https?://\S+')


def detect_platform(url: str) -> Platform:
    """Detect which platform a URL belongs to."""
    url_lower = url.lower()

    # Check TikTok
    for pattern in TIKTOK_PATTERNS:
        if re.match(pattern, url_lower):
            return Platform.TIKTOK

    # Check RedNote
    for pattern in REDNOTE_PATTERNS:
        if re.match(pattern, url_lower):
            return Platform.REDNOTE

    # Check Douyin
    for pattern in DOUYIN_PATTERNS:
        if re.match(pattern, url_lower):
            return Platform.DOUYIN

    # Check YouTube
    for pattern in YOUTUBE_PATTERNS:
        if re.match(pattern, url_lower):
            return Platform.YOUTUBE

    # Fallback: check domain keywords
    if "tiktok.com" in url_lower:
        return Platform.TIKTOK
    if any(domain in url_lower for domain in ["xiaohongshu.com", "xhslink.com", "rednote.com"]):
        return Platform.REDNOTE
    if "douyin.com" in url_lower:
        return Platform.DOUYIN
    if any(domain in url_lower for domain in ["youtube.com", "youtu.be"]):
        return Platform.YOUTUBE

    return Platform.UNKNOWN


def extract_links(text: str) -> list[LinkInfo]:
    """
    Extract all supported video links from a text message.
    Returns a list of LinkInfo objects for recognized platforms.
    """
    results = []
    urls = _URL_GENERAL_PATTERN.findall(text)

    for url in urls:
        # Clean trailing punctuation that might be captured
        url = url.rstrip('.,;:!?)\'"')
        platform = detect_platform(url)

        if platform != Platform.UNKNOWN:
            results.append(LinkInfo(
                platform=platform,
                url=url,
                original_text=text,
            ))

    return results


def get_platform_emoji(platform: Platform) -> str:
    """Get a display emoji for the platform."""
    return {
        Platform.TIKTOK: "🎵",
        Platform.REDNOTE: "📕",
        Platform.DOUYIN: "🎶",
        Platform.YOUTUBE: "📺",
        Platform.UNKNOWN: "❓",
    }.get(platform, "❓")


def get_platform_name(platform: Platform) -> str:
    """Get a display name for the platform."""
    return {
        Platform.TIKTOK: "TikTok",
        Platform.REDNOTE: "RedNote (Xiaohongshu)",
        Platform.DOUYIN: "Douyin",
        Platform.YOUTUBE: "YouTube",
        Platform.UNKNOWN: "Unknown",
    }.get(platform, "Unknown")
