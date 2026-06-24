"""
Auto Post Bot main entry point.

Run:
    python main.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from telegram.ext import ApplicationBuilder

# Add project root to Python path.
sys.path.insert(0, str(Path(__file__).parent))

from bot.handlers import setup_handlers
from config import config
from downloader.engine import VideoDownloader
from utils.logger import get_logger, setup_logger
from youtube.auth import get_service_pool
from youtube.copyright_monitor import monitor_loop


async def post_init(application):
    """Start background tasks after bot initialization."""

    service_pool = application.bot_data.get("service_pool")
    if service_pool:
        asyncio.create_task(monitor_loop(service_pool))


def main() -> None:
    """Initialize and start the Telegram bot."""

    setup_logger(level=config.LOG_LEVEL)
    logger = get_logger("main")

    logger.info("=" * 50)
    logger.info("Auto Post Bot starting")
    logger.info("=" * 50)

    errors = config.validate()
    non_blocking_errors = [error for error in errors if "No client_secret" in error]
    blocking_errors = [error for error in errors if "No client_secret" not in error]

    if blocking_errors:
        logger.error("Configuration errors found:")
        for error in blocking_errors:
            logger.error(" - %s", error)
        logger.error("Fix .env and try again. See .env.example for reference.")
        sys.exit(1)

    for warning in non_blocking_errors:
        logger.warning("Non-blocking configuration warning: %s", warning)

    logger.info("Configuration validated")

    service_pool = None
    if config.has_youtube_credentials():
        logger.info("Authenticating with YouTube API...")
        try:
            service_pool = get_service_pool(credentials_dir=config.CREDENTIALS_DIR)
        except Exception as exc:
            logger.warning("YouTube upload authentication unavailable: %s", exc)
            logger.warning("Upload commands are disabled, but /srt can still run.")
    else:
        logger.warning("No YouTube upload credentials found. Upload commands are disabled; /srt is available.")

    downloader = VideoDownloader(download_dir=config.DOWNLOAD_DIR)
    logger.info("Download directory: %s", config.DOWNLOAD_DIR)
    logger.info("SRT work directory: %s", config.SRT_WORK_DIR)

    application = (
        ApplicationBuilder()
        .token(config.TELEGRAM_BOT_TOKEN)
        .post_init(post_init)
        .build()
    )

    application.bot_data["service_pool"] = service_pool

    setup_handlers(
        application=application,
        service_pool=service_pool,
        downloader=downloader,
    )

    logger.info("Bot is running. Send /srt to generate subtitles.")
    application.run_polling(
        drop_pending_updates=True,
        allowed_updates=["message", "callback_query"],
    )


if __name__ == "__main__":
    main()
