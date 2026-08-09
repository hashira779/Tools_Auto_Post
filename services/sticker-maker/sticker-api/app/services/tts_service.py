"""
Text-to-Speech Service — Powered by Microsoft Edge TTS
Supports 30+ languages including Khmer, English, Chinese, Japanese, Korean, Thai, etc.
Free, lightweight, no GPU required. Studio-quality neural voices.
"""

import io
import json
import logging
import asyncio
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

# ── Voice Registry ──────────────────────────────────────────────
# Curated list of the best neural voices for common languages.
# Full list is fetched dynamically via edge-tts at runtime.

FEATURED_VOICES = [
    # English
    {"id": "en-US-GuyNeural", "name": "Guy (American)", "lang": "English", "gender": "Male", "locale": "en-US"},
    {"id": "en-US-JennyNeural", "name": "Jenny (American)", "lang": "English", "gender": "Female", "locale": "en-US"},
    {"id": "en-GB-RyanNeural", "name": "Ryan (British)", "lang": "English", "gender": "Male", "locale": "en-GB"},
    {"id": "en-GB-SoniaNeural", "name": "Sonia (British)", "lang": "English", "gender": "Female", "locale": "en-GB"},
    {"id": "en-AU-WilliamNeural", "name": "William (Australian)", "lang": "English", "gender": "Male", "locale": "en-AU"},
    # Khmer
    {"id": "km-KH-PisethNeural", "name": "ពិសិដ្ឋ (Khmer Male)", "lang": "ខ្មែរ", "gender": "Male", "locale": "km-KH"},
    {"id": "km-KH-SreymomNeural", "name": "ស្រីមុំ (Khmer Female)", "lang": "ខ្មែរ", "gender": "Female", "locale": "km-KH"},
    # Chinese
    {"id": "zh-CN-YunxiNeural", "name": "Yunxi (Chinese Male)", "lang": "中文", "gender": "Male", "locale": "zh-CN"},
    {"id": "zh-CN-XiaoxiaoNeural", "name": "Xiaoxiao (Chinese Female)", "lang": "中文", "gender": "Female", "locale": "zh-CN"},
    # Japanese
    {"id": "ja-JP-KeitaNeural", "name": "Keita (Japanese)", "lang": "日本語", "gender": "Male", "locale": "ja-JP"},
    {"id": "ja-JP-NanamiNeural", "name": "Nanami (Japanese)", "lang": "日本語", "gender": "Female", "locale": "ja-JP"},
    # Korean
    {"id": "ko-KR-InJoonNeural", "name": "InJoon (Korean)", "lang": "한국어", "gender": "Male", "locale": "ko-KR"},
    {"id": "ko-KR-SunHiNeural", "name": "SunHi (Korean)", "lang": "한국어", "gender": "Female", "locale": "ko-KR"},
    # Thai
    {"id": "th-TH-NiwatNeural", "name": "Niwat (Thai)", "lang": "ไทย", "gender": "Male", "locale": "th-TH"},
    {"id": "th-TH-PremwadeeNeural", "name": "Premwadee (Thai)", "lang": "ไทย", "gender": "Female", "locale": "th-TH"},
    # Vietnamese
    {"id": "vi-VN-NamMinhNeural", "name": "Nam Minh (Vietnamese)", "lang": "Tiếng Việt", "gender": "Male", "locale": "vi-VN"},
    {"id": "vi-VN-HoaiMyNeural", "name": "Hoai My (Vietnamese)", "lang": "Tiếng Việt", "gender": "Female", "locale": "vi-VN"},
    # French
    {"id": "fr-FR-HenriNeural", "name": "Henri (French)", "lang": "Français", "gender": "Male", "locale": "fr-FR"},
    {"id": "fr-FR-DeniseNeural", "name": "Denise (French)", "lang": "Français", "gender": "Female", "locale": "fr-FR"},
    # Spanish
    {"id": "es-ES-AlvaroNeural", "name": "Alvaro (Spanish)", "lang": "Español", "gender": "Male", "locale": "es-ES"},
    {"id": "es-ES-ElviraNeural", "name": "Elvira (Spanish)", "lang": "Español", "gender": "Female", "locale": "es-ES"},
    # Hindi
    {"id": "hi-IN-MadhurNeural", "name": "Madhur (Hindi)", "lang": "हिन्दी", "gender": "Male", "locale": "hi-IN"},
    {"id": "hi-IN-SwaraNeural", "name": "Swara (Hindi)", "lang": "हिन्दी", "gender": "Female", "locale": "hi-IN"},
    # Arabic
    {"id": "ar-SA-HamedNeural", "name": "Hamed (Arabic)", "lang": "العربية", "gender": "Male", "locale": "ar-SA"},
    {"id": "ar-SA-ZariyahNeural", "name": "Zariyah (Arabic)", "lang": "العربية", "gender": "Female", "locale": "ar-SA"},
]

# Max text length (Edge TTS handles up to ~5000 chars well)
MAX_TEXT_LENGTH = 5000


def get_featured_voices() -> List[Dict]:
    """Return curated list of featured voices."""
    return FEATURED_VOICES


async def get_all_voices() -> List[Dict]:
    """Fetch all available voices from Edge TTS dynamically."""
    try:
        import edge_tts
        voices = await edge_tts.list_voices()
        result = []
        for v in voices:
            result.append({
                "id": v["ShortName"],
                "name": v["FriendlyName"],
                "lang": v.get("Locale", ""),
                "gender": v.get("Gender", ""),
                "locale": v.get("Locale", ""),
            })
        return result
    except Exception as e:
        logger.error(f"Failed to fetch voices: {e}")
        return FEATURED_VOICES


async def generate_speech(
    text: str,
    voice_id: str = "en-US-GuyNeural",
    rate: str = "+0%",
    pitch: str = "+0Hz",
    output_format: str = "mp3",
) -> bytes:
    """
    Generate speech audio from text using Edge TTS.
    
    Args:
        text: The text to convert to speech (max 5000 chars)
        voice_id: Edge TTS voice short name (e.g. 'en-US-GuyNeural')
        rate: Speech rate adjustment (e.g. '+20%', '-10%')
        pitch: Pitch adjustment (e.g. '+5Hz', '-3Hz')
        output_format: Output format ('mp3')
    
    Returns:
        Raw MP3 audio bytes
    """
    import edge_tts

    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    if len(text) > MAX_TEXT_LENGTH:
        raise ValueError(f"Text too long. Maximum {MAX_TEXT_LENGTH} characters allowed.")

    # Validate voice_id exists (fallback to default)
    valid_ids = {v["id"] for v in FEATURED_VOICES}
    if voice_id not in valid_ids:
        # Try to use it anyway (Edge TTS has many more voices)
        logger.info(f"Voice '{voice_id}' not in featured list, attempting anyway...")

    try:
        communicate = edge_tts.Communicate(
            text=text.strip(),
            voice=voice_id,
            rate=rate,
            pitch=pitch,
        )

        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        audio_bytes = audio_buffer.getvalue()

        if not audio_bytes:
            raise RuntimeError("Edge TTS returned empty audio")

        logger.info(
            f"Generated {len(audio_bytes) / 1024:.1f} KB audio for "
            f"{len(text)} chars using voice '{voice_id}'"
        )
        return audio_bytes

    except Exception as e:
        logger.error(f"TTS generation failed: {e}", exc_info=True)
        raise RuntimeError(f"Speech generation failed: {str(e)}")
