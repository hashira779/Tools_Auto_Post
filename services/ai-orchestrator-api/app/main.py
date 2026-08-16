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
from typing import List, Dict, Optional
from fastapi import Depends, UploadFile, File
from fastapi.responses import StreamingResponse
import uuid
from .agent import Agent
from .auth import get_current_user
import json

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    messages: List[Dict[str, str]]
    model: str = "llama3.2"
    
def stream_and_save(agent_gen, db: Session, user, conversation_id: str, new_user_msg: str, request_model: str):
    # 1. Ensure conversation exists
    if conversation_id:
        conv = db.query(models.Conversation).filter(
            models.Conversation.id == conversation_id,
            models.Conversation.user_id == user.id
        ).first()
        if not conv:
            yield f"data: {json.dumps({'type': 'error', 'content': 'Conversation not found or unauthorized'})}\n\n"
            return
    else:
        # Create a new conversation
        conv = models.Conversation(user_id=user.id, title="New Chat", model=request_model)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        conversation_id = str(conv.id)
        # Inform frontend about the new ID immediately
        yield f"data: {json.dumps({'type': 'meta', 'conversation_id': conversation_id})}\n\n"

    # 2. Save user message
    user_msg_db = models.Message(conversation_id=conversation_id, role="user", content=new_user_msg)
    db.add(user_msg_db)
    db.commit()

    # 3. Stream from agent and capture output
    full_assistant_response = ""
    for chunk in agent_gen:
        # chunk is a string like: data: {"type": "chunk", "content": "..."}\n\n
        yield chunk
        if chunk.startswith("data: "):
            try:
                data = json.loads(chunk[6:].strip())
                if data.get("type") == "chunk":
                    full_assistant_response += data.get("content", "")
            except json.JSONDecodeError:
                pass

    # 4. Save assistant message when done
    if full_assistant_response:
        assistant_msg_db = models.Message(conversation_id=conversation_id, role="assistant", content=full_assistant_response)
        db.add(assistant_msg_db)
        db.commit()

@app.post("/api/chat/stream")
def chat_stream(request: ChatRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
        
    new_user_msg = request.messages[-1].get("content", "")
    
    agent = Agent(ollama_url=OLLAMA_URL, model=request.model)
    agent_gen = agent.chat(request.messages)
    
    return StreamingResponse(
        stream_and_save(agent_gen, db, user, request.conversation_id, new_user_msg, request.model),
        media_type="text/event-stream"
    )

@app.post("/api/chat/upload")
async def upload_file(file: UploadFile = File(...), user = Depends(get_current_user)):
    """Uploads a file to be processed by the AI Agent"""
    os.makedirs("/app/uploads", exist_ok=True)
    
    # Generate unique filename to prevent collisions
    ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join("/app/uploads", unique_filename)
    
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        return {"filepath": file_path, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

# --- Chat History Endpoints ---

@app.get("/api/conversations")
def get_conversations(user = Depends(get_current_user), db: Session = Depends(get_db)):
    convs = db.query(models.Conversation).filter(models.Conversation.user_id == user.id).order_by(models.Conversation.created_at.desc()).all()
    return [{"id": str(c.id), "title": c.title, "model": c.model, "created_at": c.created_at} for c in convs]

@app.get("/api/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str, user = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id, models.Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = db.query(models.Message).filter(models.Message.conversation_id == conversation_id).order_by(models.Message.created_at.asc()).all()
    return [{"id": str(m.id), "role": m.role, "content": m.content, "created_at": m.created_at} for m in messages]

@app.delete("/api/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, user = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id, models.Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    db.delete(conv)
    db.commit()
    return {"status": "success"}
