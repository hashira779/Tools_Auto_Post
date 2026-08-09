"""
Text-to-Speech Service — Powered by Microsoft Edge TTS
Supports 30+ languages including Khmer, English, Chinese, Japanese, Korean, Thai, etc.
Free, lightweight, no GPU required. Studio-quality neural voices.
"""

import io
import json
import logging
import asyncio
import httpx
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

# ── Voice Registry ──────────────────────────────────────────────
# Curated list of the best neural voices for common languages.
# Full list is fetched dynamically via edge-tts at runtime.

FEATURED_VOICES = [
    # English (Premium Kokoro)
    {"id": "kokoro-af_heart", "name": "⭐ Heart (US Female)", "lang": "English", "gender": "Female", "locale": "en-US"},
    {"id": "kokoro-af_bella", "name": "⭐ Bella (US Female)", "lang": "English", "gender": "Female", "locale": "en-US"},
    {"id": "kokoro-af_nicole", "name": "⭐ Nicole (US Female)", "lang": "English", "gender": "Female", "locale": "en-US"},
    {"id": "kokoro-am_adam", "name": "⭐ Adam (US Male)", "lang": "English", "gender": "Male", "locale": "en-US"},
    {"id": "kokoro-am_michael", "name": "⭐ Michael (US Male)", "lang": "English", "gender": "Male", "locale": "en-US"},
    {"id": "kokoro-bf_emma", "name": "⭐ Emma (UK Female)", "lang": "English", "gender": "Female", "locale": "en-GB"},
    {"id": "kokoro-bm_george", "name": "⭐ George (UK Male)", "lang": "English", "gender": "Male", "locale": "en-GB"},
    # English (Standard Edge)
    {"id": "en-US-GuyNeural", "name": "Guy (US)", "lang": "English", "gender": "Male", "locale": "en-US"},
    {"id": "en-US-JennyNeural", "name": "Jenny (US)", "lang": "English", "gender": "Female", "locale": "en-US"},
    {"id": "en-GB-RyanNeural", "name": "Ryan (UK)", "lang": "English", "gender": "Male", "locale": "en-GB"},
    {"id": "en-GB-SoniaNeural", "name": "Sonia (UK)", "lang": "English", "gender": "Female", "locale": "en-GB"},
    {"id": "en-AU-WilliamNeural", "name": "William (AU)", "lang": "English", "gender": "Male", "locale": "en-AU"},
    # Khmer
    {"id": "km-KH-PisethNeural", "name": "ពិសិដ្ឋ (Khmer Male)", "lang": "ខ្មែរ", "gender": "Male", "locale": "km-KH"},
    {"id": "km-KH-SreymomNeural", "name": "ស្រីមុំ (Khmer Female)", "lang": "ខ្មែរ", "gender": "Female", "locale": "km-KH"},
    {"id": "google-khm", "name": "Google Translate (Khmer)", "lang": "ខ្មែរ", "gender": "Neutral", "locale": "km-KH"},
    {"id": "mms-khm", "name": "Meta MMS (Offline)", "lang": "ខ្មែរ", "gender": "Neutral", "locale": "km-KH"},
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

    if voice_id.startswith("kokoro-"):
        real_voice_id = voice_id.replace("kokoro-", "")
        return await _generate_kokoro_speech(text, real_voice_id, rate)

    if voice_id == "mms-khm":
        return await _generate_mms_speech(text, rate)

    if voice_id == "google-khm":
        return await _generate_google_speech(text, rate)

    if voice_id.startswith("km-KH-Neural2"):
        return await _generate_google_cloud_speech(text, voice_id, rate)

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

async def _generate_kokoro_speech(text: str, voice_id: str, rate: str) -> bytes:
    """Generate high-quality premium voiceover using local Kokoro-FastAPI."""
    # Convert edge-tts rate to kokoro speed (0.5 to 2.0)
    speed = 1.0
    if rate == "-25%": speed = 0.85
    elif rate == "+25%": speed = 1.15
    elif rate == "+50%": speed = 1.3
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "model": "kokoro",
                "input": text,
                "voice": voice_id,
                "response_format": "mp3",
                "speed": speed
            }
            
            # The docker service name is kokoro-tts, internal port 8880
            resp = await client.post("http://kokoro-tts:8880/v1/audio/speech", json=payload)
            resp.raise_for_status()
            
            audio_bytes = resp.content
            if not audio_bytes:
                raise RuntimeError("Kokoro TTS returned empty audio")
            
            logger.info(f"Generated Kokoro audio for {len(text)} chars using voice '{voice_id}'")
            return audio_bytes
            
    except httpx.ConnectError:
        logger.error("Failed to connect to kokoro-tts container. Is it running?")
        raise RuntimeError("Premium AI Voice Engine is currently offline.")
    except Exception as e:
        logger.error(f"Kokoro TTS generation failed: {e}", exc_info=True)
        raise RuntimeError(f"Premium speech generation failed: {str(e)}")

async def _generate_mms_speech(text: str, rate: str) -> bytes:
    """Generate offline Khmer voiceover using local MMS-TTS container."""
    speed = 1.0
    if rate == "-25%": speed = 0.85
    elif rate == "+25%": speed = 1.15
    elif rate == "+50%": speed = 1.3
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "model": "mms",
                "input": text,
                "voice": "mms-khm",
                "response_format": "wav",
                "speed": speed
            }
            
            resp = await client.post("http://mms-tts:8002/v1/audio/speech", json=payload)
            resp.raise_for_status()
            
            audio_bytes = resp.content
            if not audio_bytes:
                raise RuntimeError("MMS TTS returned empty audio")
            
            logger.info(f"Generated MMS audio for {len(text)} chars")
            return audio_bytes
            
    except httpx.ConnectError:
        logger.error("Failed to connect to mms-tts container. Is it running?")
        raise RuntimeError("Offline MMS Engine is currently offline.")
    except Exception as e:
        logger.error(f"MMS TTS generation failed: {e}", exc_info=True)
        raise RuntimeError(f"Offline speech generation failed: {str(e)}")

async def _generate_google_speech(text: str, rate: str) -> bytes:
    """Generate voiceover using Google Translate TTS (gTTS)."""
    try:
        from gtts import gTTS
        import io
        
        # gTTS does not have native speed control, but we can set 'slow'
        slow = True if rate == "-25%" else False
        
        tts = gTTS(text=text, lang='km', slow=slow)
        
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        
        audio_bytes = audio_buffer.getvalue()
        if not audio_bytes:
            raise RuntimeError("Google TTS returned empty audio")
            
        logger.info(f"Generated Google TTS audio for {len(text)} chars")
        return audio_bytes
        
    except Exception as e:
        logger.error(f"Google TTS generation failed: {e}", exc_info=True)
        raise RuntimeError(f"Google speech generation failed: {str(e)}")

async def _generate_google_cloud_speech(text: str, voice_id: str, rate: str) -> bytes:
    """Generate voiceover using the official Google Cloud Text-to-Speech API."""
    try:
        from google.cloud import texttospeech
        
        # Convert our percentage rate string back to Google's float (1.0 = normal)
        speed = 1.0
        if rate == "+25%": speed = 1.25
        elif rate == "+50%": speed = 1.5
        elif rate == "-25%": speed = 0.75
        elif rate == "-50%": speed = 0.5
        
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        voice = texttospeech.VoiceSelectionParams(
            language_code="km-KH",
            name=voice_id
        )
        
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speed
        )
        
        # We must run this in a threadpool since the client isn't fully async
        import asyncio
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, 
            lambda: client.synthesize_speech(
                input=synthesis_input, voice=voice, audio_config=audio_config
            )
        )
        
        return response.audio_content
        
    except Exception as e:
        logger.error(f"Google Cloud TTS generation failed: {e}", exc_info=True)
        # Catch permission errors gracefully to alert the user
        if "credentials" in str(e).lower() or "permission" in str(e).lower():
            raise RuntimeError("Google Cloud JSON key is missing or invalid. Please check your google_credentials.json file.")
        raise RuntimeError(f"Google Cloud TTS failed: {str(e)}")




