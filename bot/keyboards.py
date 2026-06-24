"""
Inline keyboard helpers for the Telegram bot.
Provides buttons for user interactions during the upload flow.
"""

from telegram import InlineKeyboardButton, InlineKeyboardMarkup


def confirm_upload_keyboard() -> InlineKeyboardMarkup:
    """Keyboard to confirm or cancel an upload."""
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Upload to YouTube", callback_data="confirm_upload"),
            InlineKeyboardButton("❌ Cancel", callback_data="cancel_upload"),
        ]
    ])


def retry_keyboard() -> InlineKeyboardMarkup:
    """Keyboard to retry a failed download."""
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🔄 Retry Download", callback_data="retry_download"),
            InlineKeyboardButton("❌ Cancel", callback_data="cancel_upload"),
        ]
    ])


def publish_keyboard(video_id: str) -> InlineKeyboardMarkup:
    """Keyboard to manually publish a video."""
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🌐 Make Public", callback_data=f"publish_{video_id}"),
            InlineKeyboardButton("🔒 Keep Private", callback_data="keep_private"),
        ],
        [
            InlineKeyboardButton(
                "📺 Open in YouTube Studio",
                url=f"https://studio.youtube.com/video/{video_id}/edit",
            ),
        ],
    ])


def video_link_keyboard(video_url: str) -> InlineKeyboardMarkup:
    """Keyboard with link to the published video."""
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("📺 Watch on YouTube", url=video_url),
        ]
    ])
