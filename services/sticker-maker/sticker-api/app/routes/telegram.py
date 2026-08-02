"""
Telegram sticker pack management routes.
Creates, manages, and deletes sticker packs via the Telegram Bot API.
Supports 1-click automatic publish with zero configuration required.
"""

import base64
import logging
import os
import re
import time
from typing import Optional

from fastapi import APIRouter, Form, HTTPException

from app.services.telegram_service import TelegramStickerService

logger = logging.getLogger("sticker.routes.telegram")
router = APIRouter(prefix="/api/telegram", tags=["telegram"])


def _get_default_user_id() -> int:
    """Resolve default owner user ID from env or fallback."""
    val = (
        os.getenv("DEFAULT_STICKER_USER_ID")
        or os.getenv("STICKER_BOT_OWNER_ID")
        or os.getenv("ALLOWED_USERS", "").split(",")[0]
        or "789123456"
    ).strip()
    try:
        return int(val)
    except ValueError:
        return 789123456


def _get_service() -> TelegramStickerService:
    """
    Get the Telegram service with automatic fallback to TELEGRAM_BOT_TOKEN.
    """
    token = (
        os.getenv("STICKER_BOT_TOKEN")
        or os.getenv("TELEGRAM_BOT_TOKEN")
        or os.getenv("BOT_TOKEN")
        or ""
    ).strip()

    if not token or token.startswith("your_"):
        raise HTTPException(
            status_code=503,
            detail="Telegram bot token not configured. Please set STICKER_BOT_TOKEN (or TELEGRAM_BOT_TOKEN) in your .env file.",
        )
    return TelegramStickerService(token)


@router.get("/bot-info")
async def get_bot_info():
    """Get the connected Telegram bot's info and 1-click deeplink."""
    service = _get_service()
    try:
        username = await service.get_bot_username()
        return {
            "ok": True,
            "bot_username": username,
            "deeplink_web": f"https://t.me/{username}",
            "deeplink_app": f"tg://resolve?domain={username}",
        }
    except Exception as e:
        logger.error("Failed to get bot info: %s", e)
        raise HTTPException(status_code=502, detail=f"Telegram API error: {str(e)}")


@router.post("/create-pack")
async def create_pack(
    user_id: Optional[int] = Form(None),
    short_name: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    sticker_b64: str = Form(...),
    emoji: str = Form("😀"),
):
    """
    Create a new Telegram sticker pack.
    user_id, short_name, and title are optional — defaults are auto-generated!
    """
    effective_user_id = user_id or _get_default_user_id()
    effective_short_name = short_name or f"pack_{int(time.time())}"
    effective_title = title or "CamTech Stickers 🎨"

    # Validate inputs
    sanitized = re.sub(r"[^a-zA-Z0-9_]", "", effective_short_name)
    if not sanitized:
        sanitized = f"camtech_{int(time.time())}"

    try:
        sticker_bytes = base64.b64decode(sticker_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 sticker data")

    service = _get_service()

    try:
        await service.get_bot_username()
        pack_name = service.make_pack_name(sanitized, effective_user_id)

        result = await service.create_sticker_set(
            user_id=effective_user_id,
            name=pack_name,
            title=effective_title[:64],
            sticker_bytes=sticker_bytes,
            emoji=emoji or "😀",
        )
        return {"ok": True, **result}

    except ValueError as e:
        err_str = str(e)
        if "user not found" in err_str.lower() or "user_id_invalid" in err_str.lower():
            raise HTTPException(
                status_code=400,
                detail="Telegram user ID not found. Please set STICKER_BOT_OWNER_ID in your .env file (get your Telegram ID by messaging @userinfobot on Telegram).",
            )
        raise HTTPException(status_code=400, detail=err_str)
    except Exception as e:
        logger.error("Create pack failed: %s", e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Telegram API error: {str(e)}")


@router.post("/add-sticker")
async def add_sticker(
    user_id: Optional[int] = Form(None),
    pack_name: str = Form(...),
    sticker_b64: str = Form(...),
    emoji: str = Form("😀"),
):
    """
    Add a sticker to an existing pack.
    """
    effective_user_id = user_id or _get_default_user_id()

    try:
        sticker_bytes = base64.b64decode(sticker_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 sticker data")

    service = _get_service()

    try:
        result = await service.add_sticker_to_set(
            user_id=effective_user_id,
            name=pack_name.strip(),
            sticker_bytes=sticker_bytes,
            emoji=emoji or "😀",
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
