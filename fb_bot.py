"""
Facebook Auto Post Bot — Entry Point

A separate Telegram bot that downloads videos from TikTok/Douyin/RedNote,
applies a watermark/template, and uploads them to a Facebook Page.
"""

import asyncio
import html
import os
import sys

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import config
from downloader.engine import VideoDownloader
from utils.link_parser import extract_links, Platform, get_platform_emoji, get_platform_name
from downloader.metadata import extract_metadata
from utils.logger import get_logger
from facebook.uploader import upload_video_to_facebook, check_page_access
from facebook.template import apply_watermark

logger = get_logger("fb_bot")

# --- Globals ---
_downloader = VideoDownloader(config.DOWNLOAD_DIR)


# ============================
# Command Handlers
# ============================

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    await update.message.reply_text(
        "📘 <b>Facebook Auto Post Bot</b>\n\n"
        "Send me a video link from:\n"
        "🎵 TikTok (tiktok.com)\n"
        "🎶 Douyin (douyin.com)\n"
        "📕 RedNote (xiaohongshu.com)\n"
        "📺 YouTube (youtube.com / Shorts)\n\n"
        "I'll download the video in highest quality (up to 4K), apply your watermark, "
        "and upload it to your Facebook Page automatically!\n\n"
        "Type /help for more info.",
        parse_mode=ParseMode.HTML,
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    await update.message.reply_text(
        "📘 <b>Facebook Auto Post Bot — Help</b>\n\n"
        "<b>How to use:</b>\n"
        "1. Copy a video link from TikTok, Douyin, or RedNote\n"
        "2. Paste it here\n"
        "3. Bot downloads → applies watermark → uploads to Facebook\n\n"
        "<b>Commands:</b>\n"
        "/start — Welcome message\n"
        "/help — This help message\n"
        "/fbstatus — Check Facebook Page connection\n",
        parse_mode=ParseMode.HTML,
    )


async def cmd_fbstatus(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Check Facebook Page connection status."""
    page_id = os.getenv("FB_PAGE_ID", "")
    token = os.getenv("FB_PAGE_ACCESS_TOKEN", "")

    if not page_id or not token:
        await update.message.reply_text(
            "❌ <b>Facebook not configured!</b>\n\n"
            "Please add these to your .env file:\n"
            "• FB_PAGE_ID\n"
            "• FB_PAGE_ACCESS_TOKEN\n",
            parse_mode=ParseMode.HTML,
        )
        return

    status_msg = await update.message.reply_text("⏳ Checking Facebook connection...")

    if check_page_access(page_id, token):
        await status_msg.edit_text(
            "✅ <b>Facebook Page Connected!</b>\n\n"
            f"Page ID: <code>{page_id}</code>\n"
            "Ready to upload videos.",
            parse_mode=ParseMode.HTML,
        )
    else:
        await status_msg.edit_text(
            "❌ <b>Facebook connection failed!</b>\n\n"
            "Please check your FB_PAGE_ACCESS_TOKEN in .env",
            parse_mode=ParseMode.HTML,
        )


# ============================
# Message Handler
# ============================

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming messages with video links."""
    if not update.message or not update.message.text:
        return

    text = update.message.text.strip()
    links = extract_links(text)

    if not links:
        await update.message.reply_text(
            "🤔 I didn't find any supported links.\n\n"
            "Please paste a video link from:\n"
            "🎵 TikTok (tiktok.com)\n"
            "🎶 Douyin (douyin.com)\n"
            "📕 RedNote (xiaohongshu.com)\n\n"
            "Type /help for more info."
        )
        return

    link = links[0]
    platform = link.platform
    platform_name = get_platform_name(platform)
    platform_emoji = get_platform_emoji(platform)

    status_msg = await update.message.reply_text(
        f"📥 Downloading from {platform_emoji} {platform_name}...",
        parse_mode=ParseMode.HTML,
    )

    # --- Step 1: Download ---
    try:
        result = await _downloader.download(link.url)
    except Exception as e:
        await status_msg.edit_text(f"❌ Download failed: {e}")
        return

    if not result.success:
        await status_msg.edit_text(
            f"❌ <b>Download Failed</b>\n\n"
            f"Error: {html.escape(result.error_message or 'Unknown error')}",
            parse_mode=ParseMode.HTML,
        )
        return

    # --- Step 2: Extract metadata ---
    platform = get_platform_name(result.platform) if hasattr(result, "platform") else "Unknown"
    original_url = result.info_dict.get("webpage_url", "Unknown URL")
    metadata = extract_metadata(result.info_dict, platform, original_url)

    await status_msg.edit_text(
        f"✅ <b>Downloaded!</b>\n\n"
        f"📹 {html.escape(metadata.title)}\n"
        f"⏱️ {metadata.duration}s | 📦 {result.filesize_mb:.1f} MB\n\n"
        "🎨 Applying watermark...",
        parse_mode=ParseMode.HTML,
    )

    # --- Step 3: Apply watermark ---
    watermark_path = os.getenv("FB_WATERMARK_PATH", "")
    watermark_text = os.getenv("FB_WATERMARK_TEXT", "")
    watermark_position = os.getenv("FB_WATERMARK_POSITION", "bottom_right")
    watermark_opacity = float(os.getenv("FB_WATERMARK_OPACITY", "0.7"))

    output_path = result.filepath.replace(".mp4", "_fb.mp4")

    if watermark_path or watermark_text:
        success = apply_watermark(
            input_path=result.filepath,
            output_path=output_path,
            watermark_path=watermark_path if watermark_path else None,
            watermark_text=watermark_text if watermark_text else None,
            position=watermark_position,
            opacity=watermark_opacity,
        )
        if not success:
            logger.warning("Watermark failed, using original video")
            output_path = result.filepath
    else:
        # No watermark configured, use original
        output_path = result.filepath

    await status_msg.edit_text(
        f"✅ <b>Downloaded!</b>\n\n"
        f"📹 {html.escape(metadata.title)}\n"
        f"⏱️ {metadata.duration}s | 📦 {result.filesize_mb:.1f} MB\n\n"
        "📘 Uploading to Facebook...",
        parse_mode=ParseMode.HTML,
    )

    # --- Step 4: Upload to Facebook ---
    page_id = os.getenv("FB_PAGE_ID", "")
    token = os.getenv("FB_PAGE_ACCESS_TOKEN", "")

    if not page_id or not token:
        await status_msg.edit_text(
            "❌ <b>Facebook not configured!</b>\n\n"
            "Please add FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN to .env",
            parse_mode=ParseMode.HTML,
        )
        _downloader.cleanup(result.filepath)
        if output_path != result.filepath and os.path.exists(output_path):
            os.remove(output_path)
        return

    fb_result = upload_video_to_facebook(
        filepath=output_path,
        title=metadata.title,
        description=metadata.description,
        page_id=page_id,
        page_access_token=token,
        thumbnail_path=result.thumbnail_path,
    )

    # --- Step 5: Report result ---
    if fb_result["success"]:
        await status_msg.edit_text(
            f"🎉 <b>Posted to Facebook!</b>\n\n"
            f"📹 <b>{html.escape(metadata.title)}</b>\n"
            f"🔗 <a href=\"{fb_result['post_url']}\">View on Facebook</a>\n\n"
            f"🏷️ Tags: {', '.join(metadata.tags[:5])}\n"
            f"⏱️ Duration: {metadata.duration}s",
            parse_mode=ParseMode.HTML,
        )
    else:
        await status_msg.edit_text(
            f"❌ <b>Facebook Upload Failed</b>\n\n"
            f"Error: {html.escape(str(fb_result.get('error', 'Unknown'))[:300])}\n\n"
            "Please check your Facebook credentials.",
            parse_mode=ParseMode.HTML,
        )

    # Cleanup
    _downloader.cleanup(result.filepath)
    if output_path != result.filepath and os.path.exists(output_path):
        os.remove(output_path)


# ============================
# Main
# ============================

def main():
    """Start the Facebook Auto Post Bot."""
    fb_token = os.getenv("FB_BOT_TOKEN", "")

    if not fb_token:
        logger.error("FB_BOT_TOKEN not set in .env! Cannot start Facebook bot.")
        sys.exit(1)

    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("📘 Facebook Auto Post Bot — Starting...")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    application = Application.builder().token(fb_token).build()

    # Register handlers
    application.add_handler(CommandHandler("start", cmd_start))
    application.add_handler(CommandHandler("help", cmd_help))
    application.add_handler(CommandHandler("fbstatus", cmd_fbstatus))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("🟢 Facebook Bot is running! Send a video link.")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
