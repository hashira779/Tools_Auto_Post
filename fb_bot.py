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
    ConversationHandler,
)
from pathlib import Path

WAITING_CAPTION = 1
WAITING_EDIT_VIDEO = 2
WAITING_EDIT_AUDIO = 3
WAITING_EDIT_CAPTION = 4

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import config
from downloader.engine import VideoDownloader
from utils.link_parser import extract_links, Platform, get_platform_emoji, get_platform_name
from downloader.metadata import extract_metadata
from utils.logger import get_logger, setup_logger
from facebook.uploader import upload_video_to_facebook, check_page_access
from facebook.template import apply_watermark, replace_audio

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

async def handle_link(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming messages with video links."""
    if not update.message or not update.message.text:
        return ConversationHandler.END

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
        return ConversationHandler.END

    link = links[0]
    context.user_data['link'] = link

    await update.message.reply_text(
        "📝 <b>Link Received!</b>\n\n"
        "Please type a custom caption for this video, or type <b>skip</b> to use the original auto-caption.\n"
        "<i>(Type /cancel to abort)</i>",
        parse_mode=ParseMode.HTML
    )
    return WAITING_CAPTION


async def handle_caption(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle custom caption and proceed to download."""
    if not update.message or not update.message.text:
        return WAITING_CAPTION
        
    text = update.message.text.strip()
    if text.lower() == 'skip':
        context.user_data['custom_caption'] = None
    else:
        context.user_data['custom_caption'] = text
        
    link = context.user_data.get('link')
    if not link:
        await update.message.reply_text("❌ Error: Link lost. Please send the link again.")
        return ConversationHandler.END

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
        return ConversationHandler.END

    if not result.success:
        await status_msg.edit_text(
            f"❌ <b>Download Failed</b>\n\n"
            f"Error: {html.escape(result.error_message or 'Unknown error')}",
            parse_mode=ParseMode.HTML,
        )
        return ConversationHandler.END

    # --- Step 2: Extract metadata ---
    platform_resolved = get_platform_name(result.platform) if hasattr(result, "platform") else "Unknown"
    original_url = result.info_dict.get("webpage_url", "Unknown URL")
    metadata = extract_metadata(result.info_dict, platform_resolved, original_url)

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

    success = apply_watermark(
        input_path=result.filepath,
        output_path=output_path,
        watermark_path=watermark_path if watermark_path else None,
        watermark_text=watermark_text if watermark_text else None,
        position=watermark_position,
        opacity=watermark_opacity,
    )
    if not success:
        logger.warning("Video processing failed, using original video")
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
        return ConversationHandler.END

    custom_caption = context.user_data.get('custom_caption')
    final_caption = custom_caption if custom_caption else metadata.description

    fb_result = upload_video_to_facebook(
        filepath=output_path,
        title=metadata.title,
        description=final_caption,
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

    return ConversationHandler.END


async def cmd_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel the current operation."""
    await update.message.reply_text("❌ Operation cancelled. Send a new link when you're ready.")
    return ConversationHandler.END

# ============================
# Edit Flow Handlers
# ============================

async def cmd_edit(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /edit command."""
    await update.message.reply_text(
        "🎬 <b>Edit Video Audio</b>\n\n"
        "Send me the video you want to edit. You can send a link (TikTok, Douyin, YouTube, etc.) or upload a video file.\n"
        "<i>(Type /cancel to abort)</i>",
        parse_mode=ParseMode.HTML,
    )
    return WAITING_EDIT_VIDEO


async def handle_edit_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle the video for editing."""
    status_msg = await update.message.reply_text("📥 Downloading video...")
    
    if update.message.text:
        text = update.message.text.strip()
        links = extract_links(text)
        if not links:
            await status_msg.edit_text("❌ No supported link found. Send a valid link or upload a file.")
            return WAITING_EDIT_VIDEO
        
        link = links[0]
        try:
            result = await _downloader.download(link.url)
            if not result.success:
                await status_msg.edit_text(f"❌ Download Failed: {result.error_message}")
                return WAITING_EDIT_VIDEO
            video_path = result.filepath
            
            platform_resolved = get_platform_name(result.platform) if hasattr(result, "platform") else "Unknown"
            original_url = result.info_dict.get("webpage_url", "Unknown URL")
            metadata = extract_metadata(result.info_dict, platform_resolved, original_url)
            context.user_data['edit_metadata'] = metadata
            context.user_data['edit_thumbnail'] = result.thumbnail_path
            
        except Exception as e:
            await status_msg.edit_text(f"❌ Download failed: {e}")
            return WAITING_EDIT_VIDEO
    else:
        file_obj = None
        if update.message.video:
            file_obj = update.message.video
        elif update.message.document:
            file_obj = update.message.document
            
        if not file_obj:
            await status_msg.edit_text("❌ Please send a video link or upload a video file.")
            return WAITING_EDIT_VIDEO
            
        try:
            file = await file_obj.get_file()
            video_id = f"upload_{update.message.message_id}"
            video_path = str(Path(config.DOWNLOAD_DIR) / f"{video_id}.mp4")
            await file.download_to_drive(custom_path=video_path)
            
            class DummyMetadata:
                title = "Edited Video"
                description = "Edited Video"
                duration = 0
                tags = []
            context.user_data['edit_metadata'] = DummyMetadata()
            context.user_data['edit_thumbnail'] = None
        except Exception as e:
            await status_msg.edit_text(f"❌ Failed to download file: {e}")
            return WAITING_EDIT_VIDEO

    context.user_data['edit_video_path'] = video_path
    
    metadata = context.user_data.get('edit_metadata')
    title = html.escape(getattr(metadata, 'title', 'Edited Video'))
    duration = getattr(metadata, 'duration', 0)
    filesize_mb = os.path.getsize(video_path) / (1024 * 1024) if os.path.exists(video_path) else 0
    
    await status_msg.edit_text(
        f"✅ <b>Video Received!</b>\n\n"
        f"📹 {title}\n"
        f"⏱️ {duration}s | 📦 {filesize_mb:.1f} MB\n\n"
        "Now send me the new audio. You can send an audio/video link (e.g. YouTube) or upload an audio/video file.\n"
        "<i>(Type /cancel to abort)</i>",
        parse_mode=ParseMode.HTML
    )
    return WAITING_EDIT_AUDIO


async def handle_edit_audio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle the new audio for editing."""
    status_msg = await update.message.reply_text("📥 Processing audio...")
    
    audio_path = None
    
    if update.message.text:
        text = update.message.text.strip()
        links = extract_links(text)
        if not links:
            await status_msg.edit_text("❌ No supported link found. Send a valid link or upload a file.")
            return WAITING_EDIT_AUDIO
        
        link = links[0]
        try:
            result = await _downloader.download(link.url)
            if not result.success:
                await status_msg.edit_text(f"❌ Download Failed: {result.error_message}")
                return WAITING_EDIT_AUDIO
            audio_path = result.filepath
        except Exception as e:
            await status_msg.edit_text(f"❌ Download failed: {e}")
            return WAITING_EDIT_AUDIO
    else:
        file_obj = None
        if update.message.audio:
            file_obj = update.message.audio
        elif update.message.voice:
            file_obj = update.message.voice
        elif update.message.video:
            file_obj = update.message.video
        elif update.message.document:
            file_obj = update.message.document
            
        if not file_obj:
            await status_msg.edit_text("❌ Please send an audio/video link or upload an audio/video file.")
            return WAITING_EDIT_AUDIO
            
        try:
            file = await file_obj.get_file()
            audio_id = f"upload_audio_{update.message.message_id}"
            audio_path = str(Path(config.DOWNLOAD_DIR) / f"{audio_id}.mp4")
            await file.download_to_drive(custom_path=audio_path)
        except Exception as e:
            await status_msg.edit_text(f"❌ Failed to download file: {e}")
            return WAITING_EDIT_AUDIO

    video_path = context.user_data['edit_video_path']
    output_path = video_path.replace(".mp4", "_edited.mp4")
    
    await status_msg.edit_text("🎵 Merging video and new audio...")
    success = replace_audio(video_path, audio_path, output_path)
    
    if os.path.exists(audio_path):
        os.remove(audio_path)
    if os.path.exists(video_path):
        os.remove(video_path)
        
    if not success:
        await status_msg.edit_text("❌ Failed to replace audio. Please try again or use another file.")
        return ConversationHandler.END
        
    context.user_data['edit_final_path'] = output_path
    
    await status_msg.edit_text(
        "✅ <b>Audio Replaced!</b>\n\n"
        "Please type a custom caption for this video, or type <b>skip</b> to use the original auto-caption.\n"
        "<i>(Type /cancel to abort)</i>",
        parse_mode=ParseMode.HTML
    )
    return WAITING_EDIT_CAPTION


async def handle_edit_caption(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle custom caption for the edited video and proceed to upload."""
    if not update.message or not update.message.text:
        return WAITING_EDIT_CAPTION
        
    text = update.message.text.strip()
    if text.lower() == 'skip':
        custom_caption = None
    else:
        custom_caption = text
        
    final_path = context.user_data.get('edit_final_path')
    metadata = context.user_data.get('edit_metadata')
    thumbnail = context.user_data.get('edit_thumbnail')
    
    if not final_path:
        await update.message.reply_text("❌ Error: Video path lost. Please start over.")
        return ConversationHandler.END

    status_msg = await update.message.reply_text(
        "🎨 Applying watermark...",
        parse_mode=ParseMode.HTML,
    )

    watermark_path = os.getenv("FB_WATERMARK_PATH", "")
    watermark_text = os.getenv("FB_WATERMARK_TEXT", "")
    watermark_position = os.getenv("FB_WATERMARK_POSITION", "bottom_right")
    watermark_opacity = float(os.getenv("FB_WATERMARK_OPACITY", "0.7"))

    output_path = final_path.replace(".mp4", "_fb.mp4")

    success = apply_watermark(
        input_path=final_path,
        output_path=output_path,
        watermark_path=watermark_path if watermark_path else None,
        watermark_text=watermark_text if watermark_text else None,
        position=watermark_position,
        opacity=watermark_opacity,
    )
    if not success:
        logger.warning("Video processing failed, using original video")
        output_path = final_path

    await status_msg.edit_text(
        "📘 Uploading to Facebook...",
        parse_mode=ParseMode.HTML,
    )

    page_id = os.getenv("FB_PAGE_ID", "")
    token = os.getenv("FB_PAGE_ACCESS_TOKEN", "")

    if not page_id or not token:
        await status_msg.edit_text(
            "❌ <b>Facebook not configured!</b>\n\n"
            "Please add FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN to .env",
            parse_mode=ParseMode.HTML,
        )
        if os.path.exists(final_path): os.remove(final_path)
        if output_path != final_path and os.path.exists(output_path): os.remove(output_path)
        return ConversationHandler.END

    final_caption = custom_caption if custom_caption else getattr(metadata, "description", "")

    fb_result = upload_video_to_facebook(
        filepath=output_path,
        title=getattr(metadata, "title", "Edited Video"),
        description=final_caption,
        page_id=page_id,
        page_access_token=token,
        thumbnail_path=thumbnail,
    )

    if fb_result["success"]:
        await status_msg.edit_text(
            f"🎉 <b>Posted to Facebook!</b>\n\n"
            f"📹 <b>{html.escape(getattr(metadata, 'title', 'Edited Video'))}</b>\n"
            f"🔗 <a href=\"{fb_result['post_url']}\">View on Facebook</a>\n\n"
            f"🏷️ Tags: {', '.join(getattr(metadata, 'tags', [])[:5]) if getattr(metadata, 'tags', []) else 'None'}\n"
            f"⏱️ Duration: {getattr(metadata, 'duration', 0)}s",
            parse_mode=ParseMode.HTML,
        )
    else:
        await status_msg.edit_text(
            f"❌ <b>Facebook Upload Failed</b>\n\n"
            f"Error: {html.escape(str(fb_result.get('error', 'Unknown'))[:300])}\n\n"
            "Please check your Facebook credentials.",
            parse_mode=ParseMode.HTML,
        )

    if os.path.exists(final_path): os.remove(final_path)
    if output_path != final_path and os.path.exists(output_path): os.remove(output_path)

    return ConversationHandler.END


# ============================
# Main
# ============================

def main():
    """Start the Facebook Auto Post Bot."""
    # Setup Logging
    setup_logger(level=config.LOG_LEVEL)
    
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
    
    # We use ANY for edit flows since they can involve files or text
    conv_handler = ConversationHandler(
        entry_points=[
            MessageHandler(filters.TEXT & ~filters.COMMAND, handle_link),
            CommandHandler("edit", cmd_edit)
        ],
        states={
            WAITING_CAPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_caption)],
            WAITING_EDIT_VIDEO: [MessageHandler(~filters.COMMAND, handle_edit_video)],
            WAITING_EDIT_AUDIO: [MessageHandler(~filters.COMMAND, handle_edit_audio)],
            WAITING_EDIT_CAPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_edit_caption)],
        },
        fallbacks=[CommandHandler("cancel", cmd_cancel)],
    )
    application.add_handler(conv_handler)

    logger.info("🟢 Facebook Bot is running! Send a video link.")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()

