"""
Telegram sticker pack management routes.
Creates, manages, and deletes sticker packs via the Telegram Bot API.
"""

import base64
import logging
import os
import re

from fastapi import APIRouter, Form, HTTPException

from app.services.telegram_service import TelegramStickerService

logger = logging.getLogger("sticker.routes.telegram")
router = APIRouter(prefix="/api/telegram", tags=["telegram"])

# Bot token from environment
BOT_TOKEN = os.getenv("STICKER_BOT_TOKEN", "")


def _get_service() -> TelegramStickerService:
    """Get the Telegram service, raising an error if not configured."""
    if not BOT_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="Telegram bot token not configured. Set STICKER_BOT_TOKEN environment variable.",
        )
    return TelegramStickerService(BOT_TOKEN)


@router.get("/bot-info")
async def get_bot_info():
    """Get the connected Telegram bot's info."""
    service = _get_service()
    try:
        username = await service.get_bot_username()
        return {"ok": True, "bot_username": username}
    except Exception as e:
        logger.error("Failed to get bot info: %s", e)
        raise HTTPException(status_code=502, detail=f"Telegram API error: {str(e)}")


@router.post("/create-pack")
async def create_pack(
    user_id: int = Form(...),
    short_name: str = Form(...),
    title: str = Form(...),
    sticker_b64: str = Form(...),
    emoji: str = Form("😀"),
):
    """
    Create a new Telegram sticker pack.

    - **user_id**: Telegram user ID (user must have started chat with the bot)
    - **short_name**: Short name for the pack (letters, digits, underscores)
    - **title**: Display title for the pack (1-64 chars)
    - **sticker_b64**: Base64-encoded WebP sticker image
    - **emoji**: Emoji for the first sticker
    """
    # Validate inputs
    sanitized = re.sub(r"[^a-zA-Z0-9_]", "", short_name)
    if not sanitized or len(sanitized) < 1:
        raise HTTPException(status_code=400, detail="Pack name must contain letters, digits, or underscores")

    if not title or len(title) > 64:
        raise HTTPException(status_code=400, detail="Title must be 1-64 characters")

    try:
        sticker_bytes = base64.b64decode(sticker_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 sticker data")

    service = _get_service()

    try:
        await service.get_bot_username()
        pack_name = service.make_pack_name(sanitized, user_id)

        result = await service.create_sticker_set(
            user_id=user_id,
            name=pack_name,
            title=title,
            sticker_bytes=sticker_bytes,
            emoji=emoji,
        )
        return {"ok": True, **result}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Create pack failed: %s", e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Telegram API error: {str(e)}")


@router.post("/add-sticker")
async def add_sticker(
    user_id: int = Form(...),
    pack_name: str = Form(...),
    sticker_b64: str = Form(...),
    emoji: str = Form("😀"),
):
    """
    Add a sticker to an existing pack.

    - **user_id**: Telegram user ID
    - **pack_name**: Full pack name (from create-pack response)
    - **sticker_b64**: Base64-encoded WebP sticker image
    - **emoji**: Emoji for this sticker
    """
    try:
        sticker_bytes = base64.b64decode(sticker_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 sticker data")

    service = _get_service()

    try:
        result = await service.add_sticker_to_set(
            user_id=user_id,
            name=pack_name,
            sticker_bytes=sticker_bytes,
            emoji=emoji,
        )
        return {"ok": True, **result}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Add sticker failed: %s", e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Telegram API error: {str(e)}")


@router.get("/pack/{pack_name}")
async def get_pack(pack_name: str):
    """Get info about a sticker pack."""
    service = _get_service()

    try:
        result = await service.get_sticker_set(pack_name)
        return {"ok": True, **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Get pack failed: %s", e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Telegram API error: {str(e)}")


@router.delete("/pack/{pack_name}")
async def delete_pack(pack_name: str):
    """Delete a sticker pack."""
    service = _get_service()

    try:
        ok = await service.delete_sticker_set(pack_name)
        if ok:
            return {"ok": True, "message": f"Pack '{pack_name}' deleted"}
        raise HTTPException(status_code=400, detail="Failed to delete pack")
    except Exception as e:
        logger.error("Delete pack failed: %s", e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Telegram API error: {str(e)}")
