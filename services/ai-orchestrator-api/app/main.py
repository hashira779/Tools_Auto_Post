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

from pydantic import BaseModel
from typing import List, Dict
from fastapi import Depends
from fastapi.responses import StreamingResponse
from .agent import Agent
from .auth import get_current_user

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    model: str = "llama3.2"

@app.post("/api/chat/stream")
def chat_stream(request: ChatRequest, user = Depends(get_current_user)):
    # The 'user' object is populated by Supabase Auth (guaranteed authenticated)
    # E.g. user.id is the Supabase UUID
    
    # In the future, we will use user.id to isolate conversations here.
    agent = Agent(ollama_url=OLLAMA_URL, model=request.model)
    return StreamingResponse(
        agent.chat(request.messages),
        media_type="text/event-stream"
    )

# TODO: Add more authenticated endpoints (memory, history)
