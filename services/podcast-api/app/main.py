from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.config import config
from app.routers import podcast

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("podcast-api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the FastAPI application."""
    logger.info("Starting CAMTECH Podcast Translator API...")
    
    # Initialize database tables
    # Base.metadata.create_all(bind=engine)
    # logger.info("Database initialized.")
    
    # Check resources / verify model paths
    logger.info(f"Using Whisper model: {config.WHISPER_MODEL}")
    logger.info(f"Using NLLB model: {config.NLLB_MODEL}")
    logger.info(f"Using Qwen model: {config.LLM_MODEL}")
    
    yield
    
    logger.info("Shutting down CAMTECH Podcast Translator API...")

app = FastAPI(
    title="CAMTECH Podcast Translator API",
    description="Khmer to Natural English podcast localization service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(podcast.router)

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker/Nginx."""
    return {"status": "healthy", "service": "podcast-api"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler so users never see standard ERROR 500 pages."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "An unexpected error occurred processing your request.",
            "details": str(exc) if config.LOG_LEVEL == "DEBUG" else None
        },
    )
