"""
Sticker image processing routes.
Handles image upload, style application, text sticker generation, and health checks.
"""

import base64
import logging
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response

from app.services.image_processor import (
    create_text_sticker,
    get_available_styles,
    process_image,
)

logger = logging.getLogger("sticker.routes.sticker")
router = APIRouter(prefix="/api/sticker", tags=["sticker"])

# Max upload size: 10 MB
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "sticker-maker"}


@router.get("/styles")
async def list_styles():
    """Return all available sticker processing styles."""
    return {"styles": get_available_styles()}


@router.post("/process")
async def process_sticker(
    file: UploadFile = File(...),
    style: str = Form("original"),
):
    """
    Process an uploaded image into a Telegram-ready 512×512 WebP sticker.

    - **file**: Image file (PNG, JPG, WebP, etc.)
    - **style**: Processing style (original, outline, circle, rounded, cartoon)

    Returns the processed WebP image as base64 + metadata.
    """
    # Validate file type
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read file
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10 MB)")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        processed = process_image(contents, style=style)
    except Exception as e:
        logger.error("Image processing failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    # Return as base64 (for preview in frontend) + raw download
    b64 = base64.b64encode(processed).decode("ascii")

    return {
        "success": True,
        "sticker": {
            "data_b64": b64,
            "size_kb": round(len(processed) / 1024, 1),
            "format": "webp",
            "dimensions": "512x512",
            "style": style,
        },
    }


@router.post("/process/download")
async def process_sticker_download(
    file: UploadFile = File(...),
    style: str = Form("original"),
):
    """
    Process an image and return the WebP file directly as a download.
    """
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10 MB)")

    try:
        processed = process_image(contents, style=style)
    except Exception as e:
        logger.error("Processing failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    return Response(
        content=processed,
        media_type="image/webp",
        headers={"Content-Disposition": "attachment; filename=sticker.webp"},
    )


@router.post("/text-sticker")
async def generate_text_sticker(
    text: str = Form(...),
    bg_color: str = Form("#5856d6"),
    text_color: str = Form("#ffffff"),
):
    """
    Generate a text-based sticker.

    - **text**: Text to render on the sticker
    - **bg_color**: Background color (hex)
    - **text_color**: Text color (hex)
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    if len(text) > 200:
        raise HTTPException(status_code=400, detail="Text too long (max 200 characters)")

    try:
        sticker_bytes = create_text_sticker(text.strip(), bg_color=bg_color, text_color=text_color)
    except Exception as e:
        logger.error("Text sticker failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    b64 = base64.b64encode(sticker_bytes).decode("ascii")

    return {
        "success": True,
        "sticker": {
            "data_b64": b64,
            "size_kb": round(len(sticker_bytes) / 1024, 1),
            "format": "webp",
            "dimensions": "512x512",
            "text": text.strip(),
        },
    }
