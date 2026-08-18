"""
CAMTECH Podcast Translator API — Configuration

All configuration is loaded from environment variables with sensible defaults.
"""

import os
from dataclasses import dataclass, field


@dataclass
class Config:
    """Central configuration for the podcast translator service."""

    # ── Logging ──────────────────────────────────────────────────
    LOG_LEVEL: str = field(
        default_factory=lambda: os.environ.get("LOG_LEVEL", "INFO")
    )

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = field(
        default_factory=lambda: os.environ.get(
            "DATABASE_URL",
            "postgresql://camtech:camtechpassword@localhost:5432/camtech",
        )
    )

    # ── Auth ─────────────────────────────────────────────────────
    SUPABASE_URL: str = field(
        default_factory=lambda: os.environ.get("SUPABASE_URL", "")
    )
    SUPABASE_ANON_KEY: str = field(
        default_factory=lambda: os.environ.get("SUPABASE_ANON_KEY", "")
    )

    # ── Redis / Celery ───────────────────────────────────────────
    REDIS_URL: str = field(
        default_factory=lambda: os.environ.get("REDIS_URL", "redis://localhost:6379/1")
    )

    # ── ASR (Speech Recognition) ─────────────────────────────────
    WHISPER_MODEL: str = field(
        default_factory=lambda: os.environ.get("WHISPER_MODEL", "medium")
    )
    WHISPER_LANGUAGE: str = field(
        default_factory=lambda: os.environ.get("WHISPER_LANGUAGE", "km")
    )
    WHISPER_COMPUTE_TYPE: str = field(
        default_factory=lambda: os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
    )
    WHISPER_DEVICE: str = field(
        default_factory=lambda: os.environ.get("WHISPER_DEVICE", "cpu")
    )

    # ── Translation ──────────────────────────────────────────────
    TRANSLATION_PROVIDER: str = field(
        default_factory=lambda: os.environ.get("TRANSLATION_PROVIDER", "nllb")
    )
    NLLB_MODEL: str = field(
        default_factory=lambda: os.environ.get(
            "NLLB_MODEL", "facebook/nllb-200-distilled-600M"
        )
    )
    NLLB_SOURCE_LANG: str = field(
        default_factory=lambda: os.environ.get("NLLB_SOURCE_LANG", "khm_Khmr")
    )
    NLLB_TARGET_LANG: str = field(
        default_factory=lambda: os.environ.get("NLLB_TARGET_LANG", "eng_Latn")
    )

    # ── LLM (Qwen via Ollama) ────────────────────────────────────
    LLM_PROVIDER: str = field(
        default_factory=lambda: os.environ.get("LLM_PROVIDER", "ollama")
    )
    LLM_MODEL: str = field(
        default_factory=lambda: os.environ.get("LLM_MODEL", "qwen3:4b")
    )
    OLLAMA_URL: str = field(
        default_factory=lambda: os.environ.get("OLLAMA_URL", "http://localhost:11434")
    )

    # ── TTS ──────────────────────────────────────────────────────
    TTS_PROVIDER: str = field(
        default_factory=lambda: os.environ.get("TTS_PROVIDER", "piper")
    )
    PIPER_MODELS_DIR: str = field(
        default_factory=lambda: os.environ.get(
            "PIPER_MODELS_DIR", "/app/models/piper"
        )
    )
    PIPER_DEFAULT_VOICE: str = field(
        default_factory=lambda: os.environ.get(
            "PIPER_DEFAULT_VOICE", "en_US-lessac-medium"
        )
    )

    # ── Resource Limits ──────────────────────────────────────────
    CPU_THREADS: int = field(
        default_factory=lambda: int(os.environ.get("CPU_THREADS", "8"))
    )
    WHISPER_THREADS: int = field(
        default_factory=lambda: int(os.environ.get("WHISPER_THREADS", "6"))
    )
    TRANSLATION_WORKERS: int = field(
        default_factory=lambda: int(os.environ.get("TRANSLATION_WORKERS", "1"))
    )
    LLM_WORKERS: int = field(
        default_factory=lambda: int(os.environ.get("LLM_WORKERS", "1"))
    )
    TTS_WORKERS: int = field(
        default_factory=lambda: int(os.environ.get("TTS_WORKERS", "1"))
    )

    # ── Storage ──────────────────────────────────────────────────
    STORAGE_DIR: str = field(
        default_factory=lambda: os.environ.get("STORAGE_DIR", "/app/storage")
    )
    TEMP_RETENTION_HOURS: int = field(
        default_factory=lambda: int(os.environ.get("TEMP_RETENTION_HOURS", "24"))
    )

    # ── Upload Limits ────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = field(
        default_factory=lambda: int(os.environ.get("PODCAST_MAX_FILE_SIZE_MB", "500"))
    )
    MAX_DURATION_MINUTES: int = field(
        default_factory=lambda: int(
            os.environ.get("PODCAST_MAX_DURATION_MINUTES", "120")
        )
    )

    # ── Pipeline ─────────────────────────────────────────────────
    MAX_REVISION_ATTEMPTS: int = field(
        default_factory=lambda: int(os.environ.get("MAX_REVISION_ATTEMPTS", "3"))
    )
    MAX_RETRIES: int = field(
        default_factory=lambda: int(os.environ.get("MAX_RETRIES", "3"))
    )

    # ── Segmentation ─────────────────────────────────────────────
    SEGMENT_TARGET_SECONDS: float = field(
        default_factory=lambda: float(
            os.environ.get("SEGMENT_TARGET_SECONDS", "30")
        )
    )
    SEGMENT_MAX_SECONDS: float = field(
        default_factory=lambda: float(os.environ.get("SEGMENT_MAX_SECONDS", "90"))
    )
    SEGMENT_MIN_SECONDS: float = field(
        default_factory=lambda: float(os.environ.get("SEGMENT_MIN_SECONDS", "5"))
    )

    # ── Timing Alignment ─────────────────────────────────────────
    TIMING_ACCEPT_THRESHOLD: float = field(
        default_factory=lambda: float(
            os.environ.get("TIMING_ACCEPT_THRESHOLD", "0.08")
        )
    )
    TIMING_STRETCH_THRESHOLD: float = field(
        default_factory=lambda: float(
            os.environ.get("TIMING_STRETCH_THRESHOLD", "0.15")
        )
    )
    TIME_STRETCH_MIN: float = field(
        default_factory=lambda: float(os.environ.get("TIME_STRETCH_MIN", "0.85"))
    )
    TIME_STRETCH_MAX: float = field(
        default_factory=lambda: float(os.environ.get("TIME_STRETCH_MAX", "1.15"))
    )

    # ── Usage Limits (configurable, not hard-coded) ──────────────
    FREE_MINUTES_PER_MONTH: int = field(
        default_factory=lambda: int(
            os.environ.get("FREE_MINUTES_PER_MONTH", "30")
        )
    )
    STANDARD_MINUTES_PER_MONTH: int = field(
        default_factory=lambda: int(
            os.environ.get("STANDARD_MINUTES_PER_MONTH", "300")
        )
    )
    PRO_MINUTES_PER_MONTH: int = field(
        default_factory=lambda: int(
            os.environ.get("PRO_MINUTES_PER_MONTH", "1200")
        )
    )


# Singleton config instance
config = Config()
