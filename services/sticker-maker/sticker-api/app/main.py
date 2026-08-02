"""
CamTech Studio API — FastAPI application factory.
Microservice for creating Telegram stickers and AI CV 4x6 / ID Photos.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware
    limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
    HAS_SLOWAPI = True
except ImportError:
    limiter = None
    HAS_SLOWAPI = False

from app.routes.sticker import router as sticker_router
from app.routes.telegram import router as telegram_router
from app.routes.cv import router as cv_router

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI app."""
    app = FastAPI(
        title="CamTech Studio API",
        description="Microservice for Telegram Stickers and AI CV 4x6 / ID Photo Processing",
        version="2.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Rate Limiting
    if HAS_SLOWAPI and limiter:
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
        app.add_middleware(SlowAPIMiddleware)

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routes
    app.include_router(sticker_router)
    app.include_router(telegram_router)
    app.include_router(cv_router)

    # Top-level Health Checks
    @app.get("/api/health")
    @app.get("/health")
    async def root_health():
        return {"status": "ok", "service": "camtech-studio-api"}

    return app


app = create_app()
