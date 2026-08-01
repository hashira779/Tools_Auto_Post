"""
Platform detection and configuration.
"""

import re
from typing import Optional


# ── Supported Platforms ──────────────────────────────────────────
SUPPORTED_PLATFORMS = {
    "youtube":   {"name": "YouTube",   "patterns": [r"youtube\.com", r"youtu\.be"]},
    "tiktok":    {"name": "TikTok",    "patterns": [r"tiktok\.com"]},
    "douyin":    {"name": "Douyin",    "patterns": [r"douyin\.com"]},
    "instagram": {"name": "Instagram", "patterns": [r"instagram\.com", r"instagr\.am"]},
    "facebook":  {"name": "Facebook",  "patterns": [r"facebook\.com", r"fb\.watch", r"fb\.com"]},
}


def detect_platform(url: str) -> Optional[str]:
    """Detect which platform a URL belongs to. Returns key or None."""
    url_lower = url.lower()
    for key, info in SUPPORTED_PLATFORMS.items():
        for pattern in info["patterns"]:
            if re.search(pattern, url_lower):
                return key
    return None


def get_platform_name(key: str) -> str:
    """Get human-friendly platform name from key."""
    return SUPPORTED_PLATFORMS.get(key, {}).get("name", "Unknown")
