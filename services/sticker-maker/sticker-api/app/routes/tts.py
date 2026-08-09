"""
Text-to-Speech Routes — FastAPI endpoints for generating voiceovers.
Supports 30+ languages with neural voices via Edge TTS.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Form, HTTPException, Query
from fastapi.responses import Response, JSONResponse

from app.services.tts_service import (
    generate_speech,
    get_featured_voices,
    get_all_voices,
    MAX_TEXT_LENGTH,
)

logger = logging.getLogger("tts.routes")
router = APIRouter(prefix="/api/tts", tags=["Text-to-Speech"])


@router.get("/health")
async def tts_health():
    """Health check for the TTS service."""
    return {"status": "ok", "service": "text-to-speech", "engine": "edge-tts"}


@router.get("/voices")
async def list_voices(all: bool = Query(False, description="If true, fetch ALL available voices (slow)")):
    """
    Return available TTS voices.
    By default returns curated featured voices.
    Pass ?all=true to fetch the full list (~400 voices).
    """
    if all:
        voices = await get_all_voices()
    else:
        voices = get_featured_voices()

    # Group by language for frontend
    languages = {}
    for v in voices:
        lang = v.get("lang", "Unknown")
        if lang not in languages:
            languages[lang] = []
        languages[lang].append(v)

    return {
        "voices": voices,
        "languages": languages,
        "total": len(voices),
        "max_text_length": MAX_TEXT_LENGTH,
    }


@router.post("/generate")
async def generate_voiceover(
    text: str = Form(...),
    voice_id: str = Form("en-US-GuyNeural"),
    rate: str = Form("+0%"),
    pitch: str = Form("+0Hz"),
):
    """
    Generate speech audio from text.

    - **text**: The text to convert to speech (max 5000 chars)
    - **voice_id**: Voice identifier (e.g. 'en-US-GuyNeural', 'km-KH-PisethNeural')
    - **rate**: Speed adjustment (e.g. '+20%', '-10%', '+0%')
    - **pitch**: Pitch adjustment (e.g. '+5Hz', '-3Hz', '+0Hz')

    Returns MP3 audio as a downloadable file.
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text too long. Maximum {MAX_TEXT_LENGTH} characters.",
        )

    try:
        audio_bytes = await generate_speech(
            text=text,
            voice_id=voice_id,
            rate=rate,
            pitch=pitch,
        )

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f'attachment; filename="voiceover_{voice_id}.mp3"',
                "Content-Length": str(len(audio_bytes)),
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"TTS generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Speech generation failed: {str(e)}")
