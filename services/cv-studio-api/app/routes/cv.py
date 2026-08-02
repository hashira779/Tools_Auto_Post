"""
CV & ID Photo Router — Endpoints for Local AI Microservice
"""

import base64
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import JSONResponse

from app.services.cv_processor import process_cv_photo, TEMPLATE_FILES, STANDARDS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cv", tags=["CV & ID Photo AI Studio"])


@router.get("/templates")
async def list_templates():
    """List all available CV/ID suit and uniform templates."""
    results = []
    for t_id, filename in TEMPLATE_FILES.items():
        results.append({
            "id": t_id,
            "filename": filename,
        })
    return {"templates": results, "standards": list(STANDARDS.keys())}


@router.post("/generate")
async def generate_cv_photo(
    file: UploadFile = File(...),
    template_id: str = Form("men-suit-blue"),
    bg_color: Optional[str] = Form(None),
    size: str = Form("4x6"),
    brightness: float = Form(1.0),
    contrast: float = Form(1.0),
):
    """
    Process uploaded selfie photo with Local AI ONNX Segmentation.
    """
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        output_bytes = process_cv_photo(
            image_bytes=image_bytes,
            template_id=template_id,
            bg_color_hex=bg_color,
            size_standard=size,
            brightness=brightness,
            contrast=contrast,
        )

        return Response(
            content=output_bytes,
            media_type="image/jpeg",
            headers={
                "Content-Disposition": f'attachment; filename="CV_Photo_{size}_{template_id}.jpg"'
            },
        )
    except Exception as e:
        logger.error(f"Error processing CV photo: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate CV photo: {str(e)}")


@router.post("/generate-base64")
async def generate_cv_photo_base64(
    file: UploadFile = File(...),
    template_id: str = Form("men-suit-blue"),
    bg_color: Optional[str] = Form(None),
    size: str = Form("4x6"),
    brightness: float = Form(1.0),
    contrast: float = Form(1.0),
):
    """
    Process photo and return base64 data URL for instant browser rendering.
    """
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        output_bytes = process_cv_photo(
            image_bytes=image_bytes,
            template_id=template_id,
            bg_color_hex=bg_color,
            size_standard=size,
            brightness=brightness,
            contrast=contrast,
        )

        b64_data = base64.b64encode(output_bytes).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{b64_data}"

        return JSONResponse({
            "success": True,
            "data_url": data_url,
            "template_id": template_id,
            "size": size,
        })
    except Exception as e:
        logger.error(f"Error processing CV photo base64: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process CV photo: {str(e)}")
