"""
Telegram Bot API service for creating and managing sticker packs.
Calls the Telegram HTTP API directly — no polling bot required.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

import httpx

logger = logging.getLogger("sticker.telegram")

TELEGRAM_API = "https://api.telegram.org"


class TelegramStickerService:
    """Thin wrapper around the Telegram Bot API sticker endpoints."""

    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.base_url = f"{TELEGRAM_API}/bot{bot_token}"
        self._bot_username: Optional[str] = None

    async def get_bot_username(self) -> str:
        """Fetch and cache the bot username."""
        if self._bot_username:
            return self._bot_username

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{self.base_url}/getMe")
            resp.raise_for_status()
            data = resp.json()

        if not data.get("ok"):
            raise ValueError(f"Telegram API error: {data}")

        self._bot_username = data["result"]["username"]
        logger.info("Bot username: @%s", self._bot_username)
        return self._bot_username

    def make_pack_name(self, short_name: str, user_id: int) -> str:
        """Generate a valid Telegram sticker set name."""
        sanitized = re.sub(r"[^a-zA-Z0-9_]", "", short_name)
        if not sanitized:
            sanitized = f"camtech_{user_id}"
        return f"{sanitized}_by_{self._bot_username}"

    async def create_sticker_set(
        self,
        user_id: int,
        name: str,
        title: str,
        sticker_bytes: bytes,
        emoji: str = "😀",
    ) -> dict:
        """Create a new sticker set with one initial sticker."""
        async with httpx.AsyncClient(timeout=45) as client:
            # 1. Upload sticker file to get file_id
            upload_resp = await client.post(
                f"{self.base_url}/uploadStickerFile",
                data={
                    "user_id": str(user_id),
                    "sticker_format": "static",
                },
                files={
                    "sticker": ("sticker.webp", sticker_bytes, "image/webp"),
                },
            )
            upload_data = upload_resp.json()

            if not upload_data.get("ok"):
                err_msg = upload_data.get("description", "Upload failed")
                logger.error("uploadStickerFile error: %s", err_msg)
                raise ValueError(f"Telegram error: {err_msg}")

            file_id = upload_data["result"]["file_id"]

            # 2. Create the sticker set
            stickers_json = json.dumps([{
                "sticker": file_id,
                "format": "static",
                "emoji_list": [emoji or "😀"],
            }])

            create_resp = await client.post(
                f"{self.base_url}/createNewStickerSet",
                data={
                    "user_id": str(user_id),
                    "name": name,
                    "title": title,
                    "stickers": stickers_json,
                },
            )
            result = create_resp.json()

        if not result.get("ok"):
            err_msg = result.get("description", "Unknown error")
            logger.error("createNewStickerSet error: %s", err_msg)
            raise ValueError(f"Telegram error: {err_msg}")

        logger.info("Created sticker set: %s", name)
        return {
            "name": name,
            "title": title,
            "url": f"https://t.me/addstickers/{name}",
            "deeplink_app": f"tg://addstickers?set={name}",
        }

    async def add_sticker_to_set(
        self,
        user_id: int,
        name: str,
        sticker_bytes: bytes,
        emoji: str = "😀",
    ) -> dict:
        """Add a sticker to an existing set."""
        async with httpx.AsyncClient(timeout=45) as client:
            upload_resp = await client.post(
                f"{self.base_url}/uploadStickerFile",
                data={
                    "user_id": str(user_id),
                    "sticker_format": "static",
                },
                files={
                    "sticker": ("sticker.webp", sticker_bytes, "image/webp"),
                },
            )
            upload_data = upload_resp.json()

            if not upload_data.get("ok"):
                err_msg = upload_data.get("description", "Upload failed")
                raise ValueError(f"Telegram error: {err_msg}")

            file_id = upload_data["result"]["file_id"]

            sticker_json = json.dumps({
                "sticker": file_id,
                "format": "static",
                "emoji_list": [emoji or "😀"],
            })

            add_resp = await client.post(
                f"{self.base_url}/addStickerToSet",
                data={
                    "user_id": str(user_id),
                    "name": name,
                    "sticker": sticker_json,
                },
            )
            result = add_resp.json()

        if not result.get("ok"):
            err_msg = result.get("description", "Unknown error")
            raise ValueError(f"Telegram error: {err_msg}")

        logger.info("Added sticker to set: %s", name)
        return {"success": True, "url": f"https://t.me/addstickers/{name}"}

    async def get_sticker_set(self, name: str) -> dict:
        """Get sticker set info."""
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self.base_url}/getStickerSet",
                params={"name": name},
            )
            data = resp.json()

        if not data.get("ok"):
            raise ValueError(f"Get sticker set failed: {data.get('description', 'Unknown error')}")

        result = data["result"]
        return {
            "name": result["name"],
            "title": result["title"],
            "sticker_count": len(result.get("stickers", [])),
            "url": f"https://t.me/addstickers/{result['name']}",
        }

    async def delete_sticker_set(self, name: str) -> bool:
        """Delete an entire sticker set."""
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.base_url}/deleteStickerSet",
                data={"name": name},
            )
            data = resp.json()

        return data.get("ok", False)
