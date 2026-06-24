"""
Configuration loader for the Auto Post service.
Loads settings from .env file and provides typed access.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
else:
    print("⚠️  No .env file found! Copy .env.example to .env and fill in your values.")
    print(f"   Expected location: {_env_path}")
    sys.exit(1)


class Config:
    """Application configuration loaded from environment variables."""

    # --- Telegram ---
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")

    # --- Gemini AI ---
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # --- YouTube OAuth ---
    CREDENTIALS_DIR: str = os.getenv("CREDENTIALS_DIR", "./credentials")

    # --- TikTok OAuth ---
    TIKTOK_CLIENT_KEY: str = os.getenv("TIKTOK_CLIENT_KEY", "")
    TIKTOK_CLIENT_SECRET: str = os.getenv("TIKTOK_CLIENT_SECRET", "")

    # --- Download ---
    DOWNLOAD_DIR: str = os.getenv("DOWNLOAD_DIR", "./downloads")

    # --- Lyric SRT generation ---
    SRT_WORK_DIR: str = os.getenv("SRT_WORK_DIR", "./downloads/srt")
    SRT_MAX_AUDIO_SECONDS: int = int(os.getenv("SRT_MAX_AUDIO_SECONDS", "900"))
    SRT_WHISPER_MODEL: str = os.getenv("SRT_WHISPER_MODEL", "base")
    SRT_WHISPER_LANGUAGE: str = os.getenv("SRT_WHISPER_LANGUAGE", "km").strip()
    SRT_ALIGNMENT_ENGINE: str = os.getenv("SRT_ALIGNMENT_ENGINE", "auto").strip().lower()
    SRT_MAX_CONCURRENT_TASKS: int = int(os.getenv("SRT_MAX_CONCURRENT_TASKS", "1"))
    SRT_MAX_TELEGRAM_FILE_MB: int = int(os.getenv("SRT_MAX_TELEGRAM_FILE_MB", "45"))
    SRT_FALLBACK_START_SECONDS: float = float(os.getenv("SRT_FALLBACK_START_SECONDS", "10"))
    SRT_LATE_WHISPER_START_SECONDS: float = float(os.getenv("SRT_LATE_WHISPER_START_SECONDS", "30"))
    SRT_CTC_LANGUAGE: str = os.getenv("SRT_CTC_LANGUAGE", "khm").strip()
    SRT_CTC_BATCH_SIZE: int = int(os.getenv("SRT_CTC_BATCH_SIZE", "4"))
    SRT_VOCAL_SEPARATION: bool = os.getenv("SRT_VOCAL_SEPARATION", "true").lower() == "true"
    SRT_DEMUCS_MODEL: str = os.getenv("SRT_DEMUCS_MODEL", "htdemucs").strip()

    # --- YouTube Upload ---
    DEFAULT_PRIVACY: str = os.getenv("DEFAULT_PRIVACY", "private")
    AUTO_PUBLISH: bool = os.getenv("AUTO_PUBLISH", "true").lower() == "true"
    COPYRIGHT_CHECK_TIMEOUT: int = int(os.getenv("COPYRIGHT_CHECK_TIMEOUT", "300"))
    YOUTUBE_CATEGORY_ID: str = os.getenv("YOUTUBE_CATEGORY_ID", "22")

    # --- Access Control ---
    ALLOWED_USERS: list[int] = []

    # --- Facebook Auto-Post ---
    FB_PAGE_ID: str = os.getenv("FB_PAGE_ID", "")
    FB_PAGE_ACCESS_TOKEN: str = os.getenv("FB_PAGE_ACCESS_TOKEN", "")
    FB_WATERMARK_PATH: str = os.getenv("FB_WATERMARK_PATH", "")
    FB_WATERMARK_TEXT: str = os.getenv("FB_WATERMARK_TEXT", "")
    FB_WATERMARK_POSITION: str = os.getenv("FB_WATERMARK_POSITION", "bottom_right")
    FB_WATERMARK_OPACITY: float = float(os.getenv("FB_WATERMARK_OPACITY", "0.7"))

    # --- Logging ---
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # --- Concurrency ---
    MAX_CONCURRENT_TASKS: int = int(os.getenv("MAX_CONCURRENT_TASKS", "3"))

    def __init__(self):
        # Parse allowed users
        allowed = os.getenv("ALLOWED_USERS", "")
        if allowed.strip():
            self.ALLOWED_USERS = [int(uid.strip()) for uid in allowed.split(",") if uid.strip()]

        # Ensure directories exist
        Path(self.DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)
        Path(self.SRT_WORK_DIR).mkdir(parents=True, exist_ok=True)
        Path(self.CREDENTIALS_DIR).mkdir(parents=True, exist_ok=True)

    def validate(self) -> list[str]:
        """Validate required configuration. Returns list of error messages."""
        errors = []
        if not self.TELEGRAM_BOT_TOKEN or self.TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
            errors.append("TELEGRAM_BOT_TOKEN is not set in .env")
        if self.SRT_MAX_AUDIO_SECONDS < 30:
            errors.append("SRT_MAX_AUDIO_SECONDS must be at least 30")
        if self.SRT_MAX_CONCURRENT_TASKS < 1:
            errors.append("SRT_MAX_CONCURRENT_TASKS must be at least 1")
        if self.SRT_ALIGNMENT_ENGINE not in {"auto", "whisper", "ctc"}:
            errors.append("SRT_ALIGNMENT_ENGINE must be one of: auto, whisper, ctc")
        if self.SRT_FALLBACK_START_SECONDS < 0:
            errors.append("SRT_FALLBACK_START_SECONDS must be 0 or greater")
        if self.SRT_LATE_WHISPER_START_SECONDS < 0:
            errors.append("SRT_LATE_WHISPER_START_SECONDS must be 0 or greater")
        if self.SRT_CTC_BATCH_SIZE < 1:
            errors.append("SRT_CTC_BATCH_SIZE must be at least 1")

        credentials_path = Path(self.CREDENTIALS_DIR)
        client_secrets = list(credentials_path.glob("client_secret*.json"))
        # Allow the legacy file in the root directory for backward compatibility
        legacy_client_secret = Path("client_secrets.json")
        if not client_secrets and not legacy_client_secret.exists():
            errors.append(
                f"No client_secret*.json files found in {self.CREDENTIALS_DIR} (or root directory)\n"
                "   Download them from Google Cloud Console → APIs & Services → Credentials\n"
                "   and place them in the credentials/ directory."
            )
        return errors

    def has_youtube_credentials(self) -> bool:
        """Return True if YouTube upload OAuth client files are present."""

        credentials_path = Path(self.CREDENTIALS_DIR)
        client_secrets = list(credentials_path.glob("client_secret*.json"))
        legacy_client_secret = Path("client_secrets.json")
        return bool(client_secrets or legacy_client_secret.exists())


# Singleton instance
config = Config()
