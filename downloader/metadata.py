"""
Metadata extraction and cleaning for downloaded videos.
Converts yt-dlp info_dict into clean YouTube-ready metadata.
"""

import re
from dataclasses import dataclass
from typing import Optional

from deep_translator import GoogleTranslator

from config import config
from utils.logger import get_logger

logger = get_logger("metadata")


@dataclass
class VideoMetadata:
    """Clean metadata ready for YouTube upload."""
    title: str
    description: str
    tags: list[str]
    original_url: str
    uploader: str
    duration: int  # seconds
    platform: str


def _clean_title(raw_title: str, max_length: int = 100) -> str:
    """
    Clean up a video title for YouTube.
    - Removes excessive emojis and hashtags
    - Trims to max length
    - Ensures it's not empty
    """
    if not raw_title:
        return "Untitled Video"

    title = raw_title.strip()

    # Remove hashtag groups at the end (e.g., "#fyp #viral #tiktok")
    title = re.sub(r'(\s*#\w+)+\s*$', '', title)

    # Remove multiple consecutive spaces
    title = re.sub(r'\s+', ' ', title)

    # Trim to max length, breaking at word boundary
    if len(title) > max_length:
        title = title[:max_length].rsplit(' ', 1)[0] + '...'

    # Ensure not empty after cleaning
    if not title.strip():
        return "Untitled Video"

    return title.strip()





def _translate_text(text: str) -> str:
    """Translate text to English using Google Translate."""
    if not text or not text.strip():
        return ""
    try:
        translated = GoogleTranslator(source='auto', target='en').translate(text)
        return translated if translated else text
    except Exception as e:
        logger.warning(f"Failed to translate text: {e}")
    return text




def _clean_description(
    raw_description: str,
    original_url: str,
    uploader: str,
    platform: str,
) -> str:
    """
    Build a YouTube description from the original metadata.
    Includes the original description, credit, and source link.
    """
    parts = []

    # Default description for Mossy mood
    parts.append("Welcome to Mossy mood! 🌿\n")

    # Translated or AI generated description
    if raw_description:
        desc = raw_description.strip()
        # Remove excessive newlines
        desc = re.sub(r'\n{3,}', '\n\n', desc)
        parts.append(desc)

    # Footer
    parts.append("\n" + "─" * 40)
    parts.append("\n⚡ Uploaded to Mossy mood")

    return "\n".join(parts)


def _extract_tags(info_dict: dict, max_tags: int = 15) -> list[str]:
    """
    Extract tags from the video metadata.
    Combines yt-dlp tags with hashtags from the title/description.
    """
    tags = set()

    # Tags from yt-dlp
    if info_dict.get('tags'):
        for tag in info_dict['tags']:
            if isinstance(tag, str) and len(tag) > 1:
                tags.add(tag.strip().lower())

    # Extract hashtags from title and description
    text = f"{info_dict.get('title', '')} {info_dict.get('description', '')}"
    hashtags = re.findall(r'#(\w+)', text)
    for ht in hashtags:
        if len(ht) > 1:
            tags.add(ht.lower())

    # Remove platform-specific tags that aren't useful on YouTube
    exclude = {'fyp', 'foryou', 'foryoupage', 'xyzbca', 'viral', 'blowthisup',
               'xiaohongshu', 'rednote', 'tiktok'}
    tags = tags - exclude

    # Convert to list and limit
    tag_list = sorted(tags)[:max_tags]

    # Add platform tag
    platform = info_dict.get('extractor_key', '').lower()
    if platform and platform not in tag_list:
        tag_list.insert(0, platform)

    return tag_list[:max_tags]


def extract_metadata(info_dict: dict, platform_name: str, original_url: str) -> VideoMetadata:
    """
    Extract and clean metadata from yt-dlp info_dict.

    Args:
        info_dict: Raw metadata dictionary from yt-dlp
        platform_name: Display name of the source platform
        original_url: Original URL that was downloaded

    Returns:
        VideoMetadata with cleaned, YouTube-ready fields
    """
    raw_title = info_dict.get('title') or info_dict.get('fulltitle', '')
    raw_description = info_dict.get('description', '')
    uploader = info_dict.get('uploader') or info_dict.get('creator') or info_dict.get('channel', '')
    duration = info_dict.get('duration', 0) or 0

    # Fix generic titles from platforms like XiaoHongShu or TikTok
    lower_title = raw_title.strip().lower()
    if ('xiaohongshu video' in lower_title or 'tiktok video' in lower_title or 
        'douyin video' in lower_title or 'instagram video' in lower_title or 
        lower_title == 'video') and raw_description:
        # Use the first line of the description as the title instead
        raw_title = raw_description.split('\n')[0][:100]

    title = _clean_title(raw_title)

    # Always use Google Translate for title
    if title and title != "Untitled Video":
        title = _translate_text(title)
        if len(title) > 100:
            title = title[:100].rsplit(' ', 1)[0] + '...'
        logger.info(f"🌐 Translated title: '{title}'")

    # For description, use instant Google Translate
    final_desc_text = ""
    if raw_description:
        final_desc_text = _translate_text(raw_description)
        logger.info(f"🌐 Translated description instantly")

    description = _clean_description(final_desc_text, original_url, uploader, platform_name)
    tags = _extract_tags(info_dict)

    metadata = VideoMetadata(
        title=title,
        description=description,
        tags=tags,
        original_url=original_url,
        uploader=uploader,
        duration=int(duration),
        platform=platform_name,
    )

    logger.info(f"Extracted metadata — Title: '{title}' | Tags: {len(tags)} | Duration: {duration}s")
    return metadata
