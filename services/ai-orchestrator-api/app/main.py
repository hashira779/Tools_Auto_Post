import os
import requests
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from .database import engine, get_db, Base
from . import models

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="CamTech AI Orchestrator", lifespan=lifespan)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-orchestrator-api"}

@app.get("/api/models")
def get_ollama_models():
    """Proxy to Ollama to get installed models"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Ollama connection failed: {str(e)}")

# TODO: Add auth endpoints
# TODO: Add chat streaming endpoints and tool orchestration loop
