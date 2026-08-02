"""
SaveMedia API — FastAPI application factory.
"""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware
    HAS_SLOWAPI = True
except ImportError:
    Limiter = None
    HAS_SLOWAPI = False

from app.routes.media import router as media_router

def get_real_ip(request: Request) -> str:
    """Extract real client IP behind Cloudflare and Nginx proxies."""
    if "cf-connecting-ip" in request.headers:
        return request.headers["cf-connecting-ip"]
    if "x-forwarded-for" in request.headers:
        return request.headers["x-forwarded-for"].split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

# ── Rate Limiter ─────────────────────────────────────────────────
limiter = Limiter(key_func=get_real_ip, default_limits=["20/minute"]) if HAS_SLOWAPI else None

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI app."""
    app = FastAPI(
        title="SaveMedia API",
        description="Microservice for downloading video/audio from social platforms",
        version="1.0.0",
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
    app.include_router(media_router)

    return app


app = create_app()
