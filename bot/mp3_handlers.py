import shutil
from pathlib import Path

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from utils.logger import get_logger
from lyrics_srt.youtube_audio import download_youtube_audio, is_youtube_url
import uuid

logger = get_logger("bot.mp3_handlers")

from config import config

def _is_authorized(user_id: int) -> bool:
    if not config.ALLOWED_USERS:
        return True
    return user_id in config.ALLOWED_USERS


async def cmd_mp3(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Download a YouTube video as a high-quality MP3 and send it back."""
    user_id = update.effective_user.id
    if not _is_authorized(user_id):
        return

    args = context.args or []
    url = next((arg for arg in args if is_youtube_url(arg)), None)
    
    if not url:
        await update.message.reply_text("Please provide a valid YouTube link. Example:\n/mp3 https://youtube.com/watch?v=...")
        return

    chat_id = update.effective_chat.id
    work_dir = Path(config.DOWNLOAD_DIR) / "mp3" / f"{chat_id}_{user_id}_{uuid.uuid4().hex[:10]}"
    work_dir.mkdir(parents=True, exist_ok=True)
    
    status_msg = await update.message.reply_text("⏳ Downloading high-quality MP3...")
    
    try:
        result = await download_youtube_audio(
            url, 
            work_dir, 
            max_duration_seconds=10800,
            quality="320"
        )
        
        await status_msg.edit_text("⬆️ Uploading MP3 to Telegram...")
        
        with open(result.audio_path, 'rb') as audio_file:
            await context.bot.send_audio(
                chat_id=chat_id,
                audio=audio_file,
                title=result.title,
                performer="Auto Post Bot",
                read_timeout=300,
                write_timeout=300
            )
            
        await status_msg.delete()
        
    except Exception as exc:
        logger.error(f"MP3 download failed: {exc}", exc_info=True)
        await status_msg.edit_text(f"❌ Failed to download MP3:\n{exc}")
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


def setup_mp3_handlers(application: Application) -> None:
    """Register MP3 handlers."""
    application.add_handler(CommandHandler("mp3", cmd_mp3))
