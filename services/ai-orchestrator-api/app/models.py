import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, Integer, LargeBinary
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_user_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="active")
    is_admin = Column(Integer, default=0) # 0 = user, 1 = admin
    is_verified = Column(Integer, default=0) # 0 = not verified, 1 = verified
    used_token_id = Column(UUID(as_uuid=True), ForeignKey("admin_tokens.id"), nullable=True)
    
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    generated_documents = relationship("GeneratedDocument", back_populates="user", cascade="all, delete-orphan")

class AdminToken(Base):
    __tablename__ = "admin_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token_key = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True) # If null, it's permanent
    max_uses = Column(Integer, default=1) # 0 for unlimited
    current_uses = Column(Integer, default=0)
    is_active = Column(Integer, default=1) # 1 = active, 0 = disabled
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

class AdminActionLog(Base):
    __tablename__ = "admin_action_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String(255), nullable=False)
    details = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=True)
    model = Column(String(255), default="llama3.1:8b")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    role = Column(String(50), nullable=False) # 'user', 'assistant', 'tool', 'system'
    content = Column(Text, nullable=True)
    tool_calls = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    conversation = relationship("Conversation", back_populates="messages")

class AIUsage(Base):
    __tablename__ = "ai_usage"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    model = Column(String(255), nullable=False)
    request_count = Column(Integer, default=1)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    tool_calls = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class GeneratedDocument(Base):
    __tablename__ = "generated_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    content = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="generated_documents")


class N8nWorkflow(Base):
    """Registered n8n workflows that can be triggered from the web UI."""
    __tablename__ = "n8n_workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    n8n_workflow_id = Column(String(255), nullable=False, unique=True)
    webhook_path = Column(String(512), nullable=True)          # e.g. /webhook/abc123
    category = Column(String(100), default="general")          # social, backup, notify…
    is_active = Column(Integer, default=1)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    logs = relationship("AutomationLog", back_populates="workflow", cascade="all, delete-orphan")


class AutomationLog(Base):
    """Log of every workflow trigger — who ran it, what happened, how long it took."""
    __tablename__ = "automation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("n8n_workflows.id"), nullable=False)
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    payload = Column(JSONB, nullable=True)
    response = Column(JSONB, nullable=True)
    status = Column(String(50), default="pending")   # pending / success / error
    duration_ms = Column(Integer, nullable=True)
    executed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    workflow = relationship("N8nWorkflow", back_populates="logs")


class GoogleConnection(Base):
    """Future-ready: store per-user Google API tokens for Sheets/Drive/Gmail via n8n."""
    __tablename__ = "google_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    scopes = Column(Text, nullable=True)
    access_token_enc = Column(Text, nullable=True)       # encrypted at rest
    refresh_token_enc = Column(Text, nullable=True)       # encrypted at rest
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
