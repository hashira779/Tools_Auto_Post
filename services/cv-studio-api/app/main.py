"""
CV & ID Photo AI Studio Microservice — FastAPI Main Application
"""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routes.cv import router as cv_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cv-studio-api")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="CamTech CV & ID Photo AI Studio Microservice",
    description="Microservice for 4x6 CV photos, official uniforms, and Local ONNX AI head segmentation",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(cv_router)


@app.get("/api/health")
async def health_check():
    """Service health check."""
    return {
        "status": "healthy",
        "service": "cv-studio-api",
        "version": "1.0.0",
    }
