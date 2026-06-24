"""
Telegram bot command and message handlers.
Orchestrates the full pipeline: receive link → download → upload → copyright check.
"""

import html
import asyncio
import os
import json
from pathlib import Path
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)
from telegram.constants import ParseMode

from config import config
from utils.link_parser import extract_links, get_platform_emoji, get_platform_name, Platform
from utils.logger import get_logger
from downloader.engine import VideoDownloader
from downloader.metadata import extract_metadata
from youtube.uploader import upload_video, update_privacy, delete_video
from youtube.copyright_check import check_copyright_status
from youtube.copyright_monitor import track_video
from youtube.auth import create_telegram_oauth_flow, complete_telegram_oauth_flow
from tiktok.uploader import upload_to_tiktok
from tiktok.auth import create_tiktok_oauth_flow, complete_tiktok_oauth_flow
from bot.keyboards import (
    confirm_upload_keyboard,
    retry_keyboard,
    publish_keyboard,
    video_link_keyboard,
)
from bot.srt_handlers import setup_srt_handlers
from bot.mp3_handlers import setup_mp3_handlers

logger = get_logger("bot.handlers")

# Module-level instances (initialized in setup_handlers)
_downloader: VideoDownloader = None
_service_pool = None
_semaphore = None

PROCESSED_URLS_FILE = "processed_urls.txt"
_processed_urls = set()

def load_processed_urls():
    if os.path.exists(PROCESSED_URLS_FILE):
        try:
            with open(PROCESSED_URLS_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    _processed_urls.add(line.strip())
        except Exception as e:
            logger.error(f"Failed to load processed URLs: {e}")

def mark_url_processed(url: str):
    if url not in _processed_urls:
        _processed_urls.add(url)
        try:
            with open(PROCESSED_URLS_FILE, "a", encoding="utf-8") as f:
                f.write(f"{url}\n")
        except Exception as e:
            logger.error(f"Failed to save processed URL: {e}")


def _is_authorized(user_id: int) -> bool:
    """Check if a user is authorized to use the bot."""
    if not config.ALLOWED_USERS:
        return True  # No restrictions
    return user_id in config.ALLOWED_USERS


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command — welcome message."""
    if not _is_authorized(update.effective_user.id):
        await update.message.reply_text("🚫 You are not authorized to use this bot.")
        return

    welcome = (
        "🚀 <b>Auto Post Bot</b>\n"
        "━━━━━━━━━━━━━━━━━━━━━\n\n"
        "Send me a <b>TikTok</b> 🎵 or <b>RedNote</b> 📕 video link and I'll:\n\n"
        "1️⃣ Download the video in best quality (up to 4K)\n"
        "2️⃣ Extract title & description automatically\n"
        "3️⃣ Upload to YouTube as private\n"
        "4️⃣ Run copyright check\n"
        "5️⃣ Publish if clean ✅\n\n"
        "━━━━━━━━━━━━━━━━━━━━━\n"
        "📌 <b>Commands:</b>\n"
        "/start — Show this message\n"
        "/help — Detailed usage guide\n"
        "/status — Check bot status\n\n"
        "Just paste a link to get started! 🎬"
    )
    await update.message.reply_text(welcome, parse_mode=ParseMode.HTML)
    await update.message.reply_text(
        "<b>SRT subtitles:</b>\n"
        "/srt - Generate song.srt and song.lrc from a YouTube song link and Khmer lyrics.\n"
        "/srt 00:10 - Force the first lyric to start at 10 seconds.\n"
        "/srt video - Also create an MP4 lyric video with a background image.\n"
        "/cancel - Cancel the current /srt flow.\n\n"
        "<b>MP3 Download:</b>\n"
        "/mp3 - Download a high-quality MP3 from a YouTube link.\n\n"
        "Only process songs you own or have permission to use.",
        parse_mode=ParseMode.HTML,
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command — detailed usage guide."""
    if not _is_authorized(update.effective_user.id):
        return

    help_text = (
        "📖 <b>How to Use Auto Post Bot</b>\n"
        "━━━━━━━━━━━━━━━━━━━━━\n\n"
        "<b>Supported Platforms:</b>\n"
        "🎵 TikTok — tiktok.com, vm.tiktok.com\n"
        "📕 RedNote — xiaohongshu.com, xhslink.com, rednote.com\n\n"
        "<b>How it works:</b>\n"
        "1. Copy a video link from TikTok or RedNote\n"
        "2. Paste it in this chat\n"
        "3. The bot downloads the video in best quality\n"
        "4. Uploads to YouTube (private first)\n"
        "5. Checks for copyright issues\n"
        "6. If clean → publishes automatically\n\n"
        "<b>Quality:</b>\n"
        "• Downloads up to 4K (2160p) when available\n"
        "• Falls back to highest available quality\n"
        "• Output format: MP4\n\n"
        "<b>Copyright Check:</b>\n"
        "• Video uploads as private first\n"
        "• YouTube runs Content ID checks (~2-5 min)\n"
        "• If clean → auto-published to public\n"
        "• If flagged → stays private, you're notified\n\n"
        "⚠️ <i>Disclaimer: Always ensure you have rights to the content.</i>"
    )
    await update.message.reply_text(help_text, parse_mode=ParseMode.HTML)
    await update.message.reply_text(
        "<b>SRT workflow</b>\n"
        "1. Send /srt\n"
        "   Or send /srt 00:10 when the first sung lyric starts at 10 seconds.\n"
        "2. Send a YouTube song link\n"
        "3. Send Khmer lyrics text, one subtitle line per line\n"
        "4. The bot returns song.srt and song.lrc\n\n"
        "Use /srt video if you also want an MP4 lyric video with a background image.\n\n"
        "<b>MP3 Download</b>\n"
        "Send /mp3 [youtube link] to instantly download the song as a high-quality MP3 file.",
        parse_mode=ParseMode.HTML,
    )


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /status command — show bot status."""
    if not _is_authorized(update.effective_user.id):
        return

    status_text = (
        "📊 <b>Bot Status</b>\n"
        "━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"🤖 Bot: <b>Online</b> ✅\n"
        f"🎥 YouTube Accounts: <b>{len(_service_pool.services) if _service_pool else 0}</b>\n"
        f"📁 Download Dir: <code>{config.DOWNLOAD_DIR}</code>\n"
        f"🔒 Default Privacy: <code>{config.DEFAULT_PRIVACY}</code>\n"
        f"📢 Auto Publish: <code>{config.AUTO_PUBLISH}</code>\n"
        f"⏱️ Copyright Timeout: <code>{config.COPYRIGHT_CHECK_TIMEOUT}s</code>\n"
    )
    await update.message.reply_text(status_text, parse_mode=ParseMode.HTML)


async def cmd_tiktokauth(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /tiktokauth command — start TikTok OAuth flow."""
    if not _is_authorized(update.effective_user.id):
        return

    if not config.TIKTOK_CLIENT_KEY or not config.TIKTOK_CLIENT_SECRET:
        await update.message.reply_text(
            "❌ <b>TikTok API keys missing!</b>\n\n"
            "Please add `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` to your `.env` file and restart the bot.",
            parse_mode=ParseMode.HTML
        )
        return

    try:
        auth_url, code_verifier = create_tiktok_oauth_flow()
        context.user_data["pending_tiktok_oauth"] = {
            "code_verifier": code_verifier
        }
        
        await update.message.reply_text(
            "🔐 <b>TikTok Authorization Required</b>\n\n"
            "Please click the link below to authorize your TikTok account:\n\n"
            f"👉 <a href='{auth_url}'>Click here to Login with TikTok</a>\n\n"
            "<b>IMPORTANT:</b> After you allow access, your browser will try to redirect you to <code>orsptt.space</code> and might show a blank page or an error.\n\n"
            "Simply <b>copy the entire URL from your browser's address bar</b> (it will contain <code>?code=...</code>) and paste it back to me here in this chat.",
            parse_mode=ParseMode.HTML,
            disable_web_page_preview=True
        )
    except Exception as e:
        logger.error(f"TikTok Auth error: {e}")
        await update.message.reply_text(f"❌ Error generating TikTok Auth URL: {e}")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handle incoming messages — detect links and start the pipeline.
    This is the main entry point for the download → upload flow.
    """
    if not _is_authorized(update.effective_user.id):
        await update.message.reply_text("🚫 You are not authorized to use this bot.")
        return

    text = update.message.text
    if not text:
        return

    # Check for pending OAuth redirect URL
    if "pending_oauth_flow" in context.user_data:
        if text.startswith("http://localhost") or "code=" in text:
            await _handle_oauth_redirect(update, context, text)
            return

    # Check for TikTok pending OAuth redirect URL
    if "pending_tiktok_oauth" in context.user_data:
        if text.startswith("http://localhost") or text.startswith("https://orsptt.space") or "code=" in text:
            await _handle_tiktok_oauth_redirect(update, context, text)
            return

    # Extract supported links from the message
    links = extract_links(text)

    if not links:
        await update.message.reply_text(
            "🤔 I didn't find any supported links in your message.\n\n"
            "Please paste a valid video link from:\n"
            "🎵 TikTok (tiktok.com)\n"
            "🎶 Douyin (douyin.com)\n"
            "📕 RedNote (xiaohongshu.com)\n\n"
            "Type /help for more info."
        )
        return

    # Process each link
    for link_info in links:
        if link_info.url in _processed_urls:
            await update.message.reply_text(
                f"⚠️ <b>Skipped duplicate link:</b>\n<code>{html.escape(link_info.url)}</code>\n\n"
                f"<i>This link has already been processed previously.</i>",
                parse_mode=ParseMode.HTML
            )
            continue
            
        mark_url_processed(link_info.url)
        asyncio.create_task(_process_video_link(update, context, link_info.url, link_info.platform))


async def _process_video_link(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    url: str,
    platform: Platform,
):
    """
    Queue wrapper for a single video link pipeline.
    """
    emoji = get_platform_emoji(platform)
    platform_name = get_platform_name(platform)

    # Let user know it's queued
    status_msg = await update.message.reply_text(
        f"⏳ <b>Queued {platform_name} video</b>\n\n"
        f"🔗 <code>{html.escape(url)}</code>\n\n"
        "Waiting for an available slot...",
        parse_mode=ParseMode.HTML,
    )

    async with _semaphore:
        await _process_video_link_inner(update, context, url, platform, emoji, platform_name, status_msg)

async def _process_video_link_inner(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    url: str,
    platform: Platform,
    emoji: str,
    platform_name: str,
    status_msg,
):
    """
    Full pipeline for a single video link:
    detect → download → extract metadata → upload → copyright check → publish.
    """
    # --- Step 1: Acknowledge (Processing started) ---
    await status_msg.edit_text(
        f"{emoji} <b>Processing {platform_name} video</b>\n\n"
        f"🔗 <code>{html.escape(url)}</code>\n\n"
        "⬇️ Starting download...",
        parse_mode=ParseMode.HTML,
    )

    # --- Step 2: Download ---
    try:
        result = await _downloader.download(url)
    except Exception as e:
        logger.error(f"Download exception: {e}", exc_info=True)
        await status_msg.edit_text(
            f"❌ <b>Download Failed</b>\n\n"
            f"Error: {html.escape(str(e))}\n\n"
            "Try again or use a different link.",
            parse_mode=ParseMode.HTML,
            reply_markup=retry_keyboard(),
        )
        # Store URL for retry
        context.user_data["last_url"] = url
        context.user_data["last_platform"] = platform
        return

    if not result.success:
        await status_msg.edit_text(
            f"❌ <b>Download Failed</b>\n\n"
            f"Error: {html.escape(result.error_message or 'Unknown error')}\n\n"
            "This could be due to:\n"
            "• Private/deleted video\n"
            "• Platform blocking downloads\n"
            "• Network issues\n\n"
            "Try again or use a different link.",
            parse_mode=ParseMode.HTML,
            reply_markup=retry_keyboard(),
        )
        context.user_data["last_url"] = url
        context.user_data["last_platform"] = platform
        return

    # --- Step 3: Extract Metadata ---
    metadata = extract_metadata(result.info_dict, platform_name, url)

    # --- Step 3.5: Reject Low Quality ---
    video_height = result.info_dict.get("height")
    if video_height:
        if platform in (Platform.TIKTOK, Platform.DOUYIN) and video_height < 1024:
            await status_msg.edit_text(
                f"❌ <b>Download Rejected</b>\n\n"
                f"Video resolution is too low ({video_height}p).\n"
                f"For {platform_name} videos, the bot requires at least 1080p quality.\n\n"
                "Try again with a higher quality video link.",
                parse_mode=ParseMode.HTML,
            )
            _downloader.cleanup(result.filepath)
            return
        elif video_height <= 480:
            await status_msg.edit_text(
                f"❌ <b>Download Rejected</b>\n\n"
                f"Video resolution is too low ({video_height}p).\n"
                f"The bot is configured to reject 480p videos to maintain high quality.\n\n"
                "Try again with a higher quality video link.",
                parse_mode=ParseMode.HTML,
            )
            _downloader.cleanup(result.filepath)
            return

    await status_msg.edit_text(
        f"✅ <b>Downloaded Successfully!</b>\n\n"
        f"📹 <b>Title:</b> {html.escape(metadata.title)}\n"
        f"👤 <b>Creator:</b> {html.escape(metadata.uploader)}\n"
        f"⏱️ <b>Duration:</b> {metadata.duration}s\n"
        f"📦 <b>Size:</b> {result.filesize_mb:.1f} MB\n"
        f"🏷️ <b>Tags:</b> {', '.join(metadata.tags[:5])}{'...' if len(metadata.tags) > 5 else ''}\n\n"
        "⬆️ Uploading to YouTube...",
        parse_mode=ParseMode.HTML,
    )

    # --- Step 4: Upload to YouTube ---
    if not _service_pool or not _service_pool.get_service():
        await status_msg.edit_text(
            "❌ <b>YouTube not connected!</b>\n\n"
            "The YouTube API service pool is empty.\n"
            "Please check the bot configuration and credentials.",
            parse_mode=ParseMode.HTML,
        )
        _downloader.cleanup(result.filepath)
        return

    # Determine upload type based on duration
    is_short = metadata.duration <= 60
    upload_type = "YouTube Short" if is_short else "YouTube Video"
    
    # Add #Shorts tag to description for short videos
    upload_description = metadata.description
    if is_short:
        upload_description = metadata.description + "\n\n#Shorts"
    
    logger.info(f"📐 Duration: {metadata.duration}s → Uploading as {upload_type}")

    # Launch TikTok upload in the background
    tiktok_task = None
    if config.TIKTOK_CLIENT_KEY and config.TIKTOK_CLIENT_SECRET:
        if platform == Platform.TIKTOK:
            logger.info("⏭️ Skipping TikTok upload because original video is already from TikTok")
        else:
            loop = asyncio.get_event_loop()
            tiktok_task = loop.run_in_executor(
                None, 
                upload_to_tiktok, 
                result.filepath, 
                metadata.title
            )

    upload_result = None
    upload_service = None
    
    while True:
        upload_service = _service_pool.get_service()
        if not upload_service:
            break
            
        upload_result = await upload_video(
            youtube_service=upload_service,
            filepath=result.filepath,
            title=metadata.title,
            description=upload_description,
            tags=metadata.tags,
            category_id=config.YOUTUBE_CATEGORY_ID,
            privacy_status=config.DEFAULT_PRIVACY,
            thumbnail_path=result.thumbnail_path,
        )

        if not upload_result.success:
            err_msg = upload_result.error_message or 'Unknown error'
            if "uploadLimitExceeded" in err_msg:
                # Rotate service
                if _service_pool.mark_quota_exceeded():
                    continue  # Retry with next service
                else:
                    break  # All exhausted
            else:
                break
        else:
            break

    if not upload_result.success:
        err_msg = upload_result.error_message or 'Unknown error'
        if "uploadLimitExceeded" in err_msg:
            await status_msg.edit_text(
                f"⚠️ <b>YouTube Daily Limit Reached!</b>\n\n"
                f"Error: {html.escape(err_msg)}\n\n"
                "Sending the video directly to you instead...",
                parse_mode=ParseMode.HTML,
            )
            try:
                # 50MB is Telegram bot API limit for video uploads
                if result.filesize_mb <= 50:
                    with open(result.filepath, 'rb') as video_file:
                        await update.message.reply_video(
                            video=video_file,
                            caption=f"📹 <b>{html.escape(metadata.title)}</b>\n\n<i>Uploaded via Telegram as YouTube limit was reached.</i>",
                            parse_mode=ParseMode.HTML,
                            read_timeout=120,
                            write_timeout=120,
                        )
                    await status_msg.delete()
                else:
                    await status_msg.edit_text(
                        f"❌ <b>Upload Failed & File Too Large</b>\n\n"
                        f"YouTube limit reached, and the video is too large ({result.filesize_mb:.1f} MB > 50 MB) to send via Telegram.",
                        parse_mode=ParseMode.HTML,
                    )
            except Exception as e:
                logger.error(f"Failed to send video to Telegram: {e}", exc_info=True)
                await status_msg.edit_text(
                    f"❌ <b>YouTube limit reached and failed to send via Telegram</b>\n\n"
                    f"Error: {html.escape(str(e))}",
                    parse_mode=ParseMode.HTML,
                )
        elif "duplicate" in err_msg.lower() or "uploadduplicate" in err_msg.lower():
            await status_msg.edit_text(
                f"⚠️ <b>YouTube Duplicate Detected!</b>\n\n"
                f"This video has already been uploaded to your channel previously.\n"
                f"Skipping...",
                parse_mode=ParseMode.HTML,
            )
        else:
            await status_msg.edit_text(
                f"❌ <b>Upload Failed</b>\n\n"
                f"Error: {html.escape(err_msg)}\n\n"
                "The video was downloaded but could not be uploaded to YouTube.",
                parse_mode=ParseMode.HTML,
            )
        _downloader.cleanup(result.filepath)
        return

    # Track this video for background copyright monitoring
    track_video(upload_result.video_id, metadata.title)

    # --- Step 5: Copyright Check & TikTok Result ---
    # Wait for TikTok upload if it was started
    tiktok_status = "Skipped (Not Configured)"
    if tiktok_task:
        try:
            tt_success = await tiktok_task
            tiktok_status = "Success ✅" if tt_success else "Failed ❌"
        except Exception as e:
            logger.error(f"TikTok upload task error: {e}")
            tiktok_status = "Error ❌"

    type_emoji = "📱" if is_short else "🎬"
    await status_msg.edit_text(
        f"⬆️ <b>Uploaded to YouTube!</b>\n\n"
        f"📹 <b>{html.escape(metadata.title)}</b>\n"
        f"🔗 {upload_result.video_url}\n"
        f"{type_emoji} Type: <b>{upload_type}</b>\n"
        f"🔒 Status: <b>Private</b>\n"
        f"🎵 TikTok: <b>{tiktok_status}</b>\n\n"
        f"🛡️ Running copyright check...\n"
        f"<i>(This may take 2-5 minutes)</i>",
        parse_mode=ParseMode.HTML,
    )

    copyright_result = await check_copyright_status(
        youtube_service=upload_service,
        video_id=upload_result.video_id,
        timeout_seconds=config.COPYRIGHT_CHECK_TIMEOUT,
    )

    # --- Step 6: Handle Result ---
    if copyright_result.is_clean and config.AUTO_PUBLISH:
        # Auto-publish
        published = await update_privacy(
            upload_service,
            upload_result.video_id,
            "public",
        )

        if published:
            await status_msg.edit_text(
                f"🎉 <b>Published Successfully!</b>\n\n"
                f"📹 <b>{html.escape(metadata.title)}</b>\n"
                f"🔗 {upload_result.video_url}\n"
                f"🌐 Status: <b>Public</b> ✅\n"
                f"🛡️ Copyright: <b>Clean</b> ✅\n\n"
                f"📊 {copyright_result.details}",
                parse_mode=ParseMode.HTML,
                reply_markup=video_link_keyboard(upload_result.video_url),
            )
        else:
            await status_msg.edit_text(
                f"⚠️ <b>Upload OK, but couldn't publish</b>\n\n"
                f"📹 <b>{html.escape(metadata.title)}</b>\n"
                f"🔗 {upload_result.video_url}\n"
                f"🔒 Status: <b>Private</b>\n"
                f"🛡️ Copyright: <b>Clean</b> ✅\n\n"
                "Please publish manually from YouTube Studio.",
                parse_mode=ParseMode.HTML,
                reply_markup=publish_keyboard(upload_result.video_id),
            )

    elif copyright_result.is_clean and not config.AUTO_PUBLISH:
        # Clean but auto-publish disabled — let user decide
        await status_msg.edit_text(
            f"✅ <b>Upload Complete — Ready to Publish</b>\n\n"
            f"📹 <b>{html.escape(metadata.title)}</b>\n"
            f"🔗 {upload_result.video_url}\n"
            f"🔒 Status: <b>Private</b>\n"
            f"🛡️ Copyright: <b>Clean</b> ✅\n\n"
            "Would you like to make it public?",
            parse_mode=ParseMode.HTML,
            reply_markup=publish_keyboard(upload_result.video_id),
        )

    elif copyright_result.status == "processing":
        # Timed out — still processing
        await status_msg.edit_text(
            f"⏰ <b>Copyright Check Timed Out</b>\n\n"
            f"📹 <b>{html.escape(metadata.title)}</b>\n"
            f"🔗 {upload_result.video_url}\n"
            f"🔒 Status: <b>Private</b>\n"
            f"🛡️ Copyright: <b>Still checking...</b> ⏳\n\n"
            f"{copyright_result.details}\n\n"
            "You can publish manually once YouTube finishes processing.",
            parse_mode=ParseMode.HTML,
            reply_markup=publish_keyboard(upload_result.video_id),
        )

    else:
        # Copyright issue or error
        claims_text = "\n".join(f"• {c}" for c in copyright_result.claims) if copyright_result.claims else "No details available"
        
        # Auto-delete the video
        deleted = await delete_video(upload_service, upload_result.video_id)
        
        status_label = "🗑️ Deleted automatically" if deleted else "🔒 Private (Failed to delete)"
        
        await status_msg.edit_text(
            f"⚠️ <b>Copyright Issue Detected</b>\n\n"
            f"📹 <b>{html.escape(metadata.title)}</b>\n"
            f"🔗 {upload_result.video_url}\n"
            f"Status: <b>{status_label}</b>\n"
            f"🛡️ Copyright: <b>{copyright_result.status.upper()}</b> ❌\n\n"
            f"<b>Claims:</b>\n{html.escape(claims_text)}\n\n"
            f"<b>Details:</b> {html.escape(copyright_result.details)}\n\n"
            "The video had copyright issues and was automatically removed.",
            parse_mode=ParseMode.HTML,
        )

    # --- Cleanup downloaded files ---
    _downloader.cleanup(result.filepath)
    logger.info(f"Pipeline complete for: {url}")


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle inline keyboard button callbacks."""
    query = update.callback_query
    await query.answer()

    data = query.data

    if data == "cancel_upload":
        await query.edit_message_text("❌ Upload cancelled.")

    elif data == "retry_download":
        url = context.user_data.get("last_url")
        platform = context.user_data.get("last_platform")
        if url and platform:
            await query.edit_message_text("🔄 Retrying download...")
            asyncio.create_task(_process_video_link(update, context, url, platform))
        else:
            await query.edit_message_text("❌ No previous link to retry.")

    elif data.startswith("publish_"):
        video_id = data.replace("publish_", "")
        await query.edit_message_text("🌐 Publishing video...")

        success = False
        for svc in _service_pool.services:
            success = await update_privacy(svc, video_id, "public")
            if success:
                break

        if success:
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            await query.edit_message_text(
                f"🎉 <b>Published!</b>\n\n"
                f"🔗 {video_url}\n"
                f"🌐 Status: <b>Public</b> ✅",
                parse_mode=ParseMode.HTML,
                reply_markup=video_link_keyboard(video_url),
            )
        else:
            await query.edit_message_text(
                "❌ Failed to publish. Please try from YouTube Studio.",
                parse_mode=ParseMode.HTML,
            )

    elif data == "keep_private":
        await query.edit_message_text(
            "🔒 Video kept as private.\n"
            "You can change this anytime from YouTube Studio.",
        )


async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle uploaded client_secret JSON files."""
    if not _is_authorized(update.effective_user.id):
        return

    doc = update.message.document
    if not doc.file_name.endswith(".json"):
        return

    status_msg = await update.message.reply_text("📥 <b>Receiving file...</b>", parse_mode=ParseMode.HTML)

    try:
        # Download file to memory with extended timeouts to prevent network issues
        file = await context.bot.get_file(
            doc.file_id, 
            read_timeout=60, 
            connect_timeout=60
        )
        content = await file.download_as_bytearray()
        data = json.loads(content.decode('utf-8'))

        # Validate it's a Google client_secret file
        if "web" not in data and "installed" not in data:
            await status_msg.edit_text("❌ This does not look like a valid Google client_secret.json file.")
            return

        # Determine next available filename
        cred_dir = Path(config.CREDENTIALS_DIR)
        existing = list(cred_dir.glob("client_secret_*.json"))
        
        # Find max number
        max_num = 0
        for p in existing:
            try:
                # client_secret_1.json -> 1
                num = int(p.stem.split("_")[-1])
                max_num = max(max_num, num)
            except ValueError:
                pass
                
        next_num = max_num + 1
        new_filename = f"client_secret_{next_num}.json"
        new_path = cred_dir / new_filename
        token_filename = f"token_{next_num}.json"
        token_path = cred_dir / token_filename

        # Save file
        with open(new_path, "wb") as f:
            f.write(content)

        await status_msg.edit_text(f"✅ Saved as <code>{new_filename}</code>.\n\n🔄 Generating authorization link...", parse_mode=ParseMode.HTML)

        # Generate OAuth Flow
        flow, auth_url = create_telegram_oauth_flow(str(new_path))
        
        # Store in user_data
        context.user_data["pending_oauth_flow"] = {
            "flow": flow,
            "token_path": str(token_path),
            "status_msg_id": status_msg.message_id
        }

        await status_msg.edit_text(
            f"🔐 <b>Authorization Required</b>\n\n"
            f"Please click the link below to authorize this new YouTube account:\n\n"
            f"<a href='{auth_url}'>👉 Click here to Login with Google</a>\n\n"
            f"<b>IMPORTANT:</b> After you allow access, your browser will try to redirect you to <code>localhost:8080</code> and show an error (like 'Site can't be reached'). This is perfectly normal!\n\n"
            f"Simply <b>copy the entire URL from your browser's address bar</b> (it will contain <code>?code=...</code>) and paste it back to me here in this chat.",
            parse_mode=ParseMode.HTML,
            disable_web_page_preview=True
        )

    except Exception as e:
        logger.error(f"Error handling document: {e}", exc_info=True)
        await status_msg.edit_text(f"❌ Error processing file: {e}")


async def _handle_oauth_redirect(update: Update, context: ContextTypes.DEFAULT_TYPE, redirect_url: str):
    """Process the OAuth redirect URL pasted by the user."""
    flow_data = context.user_data.pop("pending_oauth_flow", None)
    if not flow_data:
        return

    status_msg = await update.message.reply_text("⏳ Processing authorization...")
    try:
        token_path = flow_data["token_path"]
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            complete_telegram_oauth_flow,
            flow_data["flow"],
            redirect_url,
            token_path
        )
        
        # Load the new service into the pool
        from youtube.auth import _load_or_create_credentials
        from googleapiclient.discovery import build
        
        creds = _load_or_create_credentials(token_path, allow_interactive=False)
        if creds:
            service = build("youtube", "v3", credentials=creds)
            _service_pool.services.append(service)
            
        await status_msg.edit_text("🎉 <b>Success! Account Added!</b>\n\nYou can now upload videos using this new account.", parse_mode=ParseMode.HTML)
    except Exception as e:
        logger.error(f"OAuth Completion Error: {e}", exc_info=True)
        await status_msg.edit_text(f"❌ Authorization failed: {str(e)}\n\nPlease try uploading the file again.")


async def _handle_tiktok_oauth_redirect(update: Update, context: ContextTypes.DEFAULT_TYPE, redirect_url: str):
    """Process the TikTok OAuth redirect URL pasted by the user."""
    flow_data = context.user_data.pop("pending_tiktok_oauth", None)
    if not flow_data:
        return

    status_msg = await update.message.reply_text("⏳ Processing TikTok authorization...")
    try:
        code_verifier = flow_data["code_verifier"]
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            complete_tiktok_oauth_flow,
            redirect_url,
            code_verifier
        )
        await status_msg.edit_text("🎉 <b>Success! TikTok Account Linked!</b>\n\nVideos will now be uploaded to both YouTube and TikTok automatically.", parse_mode=ParseMode.HTML)
    except Exception as e:
        logger.error(f"TikTok OAuth Completion Error: {e}", exc_info=True)
        await status_msg.edit_text(f"❌ Authorization failed: {str(e)}\n\nPlease try /tiktokauth again.")


def setup_handlers(
    application: Application,
    service_pool,
    downloader: VideoDownloader,
):
    """
    Register all handlers with the Telegram bot application.

    Args:
        application: Telegram bot Application instance
        service_pool: YouTubeServicePool instance
        downloader: VideoDownloader instance
    """
    global _service_pool, _downloader, _semaphore
    _service_pool = service_pool
    _downloader = downloader
    _semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_TASKS)

    load_processed_urls()

    setup_srt_handlers(application, _is_authorized)
    setup_mp3_handlers(application)

    # Command handlers
    application.add_handler(CommandHandler("start", cmd_start))
    application.add_handler(CommandHandler("help", cmd_help))
    application.add_handler(CommandHandler("status", cmd_status))
    application.add_handler(CommandHandler("tiktokauth", cmd_tiktokauth))

    # Message handler for links and text
    application.add_handler(MessageHandler(
        filters.TEXT & ~filters.COMMAND,
        handle_message,
    ))

    # Message handler for documents (JSON files)
    application.add_handler(MessageHandler(
        filters.Document.FileExtension("json"),
        handle_document,
    ))

    # Callback query handler for inline keyboards
    application.add_handler(CallbackQueryHandler(handle_callback))

    logger.info("✅ Bot handlers registered")
