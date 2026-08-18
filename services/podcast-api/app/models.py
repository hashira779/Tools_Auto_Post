import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Integer, Float, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.database import Base

# ── Enums ────────────────────────────────────────────────────────
class JobStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PREPROCESSING = "PREPROCESSING"
    TRANSCRIBING = "TRANSCRIBING"
    ANALYZING = "ANALYZING"
    TRANSLATING = "TRANSLATING"
    NATURALIZING = "NATURALIZING"
    VERIFYING = "VERIFYING"
    GENERATING_VOICE = "GENERATING_VOICE"
    ALIGNING = "ALIGNING"
    MIXING = "MIXING"
    QUALITY_CHECK = "QUALITY_CHECK"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    NEEDS_REVIEW = "NEEDS_REVIEW"

class TranslationRisk(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

# ── Models ───────────────────────────────────────────────────────

class PodcastJob(Base):
    __tablename__ = "podcast_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True) # References shared users table
    title = Column(String(255), nullable=False)
    
    # Files
    original_file_path = Column(String(1024), nullable=False)
    original_filename = Column(String(255), nullable=False)
    
    # Config
    source_language = Column(String(10), default="km")
    target_language = Column(String(10), default="en")
    voice_id = Column(String(50), nullable=True)
    voice_preservation = Column(Boolean, default=False)
    strict_verification = Column(Boolean, default=False)
    match_original_timing = Column(Boolean, default=True)
    
    # State
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED)
    progress_percent = Column(Integer, default=0)
    current_stage = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Output Files
    final_mp3_path = Column(String(1024), nullable=True)
    final_wav_path = Column(String(1024), nullable=True)
    original_srt_path = Column(String(1024), nullable=True)
    english_srt_path = Column(String(1024), nullable=True)
    
    # Metrics
    duration_seconds = Column(Float, nullable=True)
    processing_time_seconds = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    segments = relationship("PodcastSegment", back_populates="job", cascade="all, delete-orphan", order_by="PodcastSegment.start_time")
    processing_logs = relationship("ProcessingLog", back_populates="job", cascade="all, delete-orphan")

class PodcastSegment(Base):
    __tablename__ = "podcast_segments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("podcast_jobs.id", ondelete="CASCADE"), nullable=False)
    index = Column(Integer, nullable=False)
    
    # Original Audio Info
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    duration = Column(Float, nullable=False)
    speaker_id = Column(String(50), nullable=True)
    
    # Transcripts
    khmer_text = Column(Text, nullable=True)
    asr_confidence = Column(Float, nullable=True)
    
    # Translation & Verification
    english_raw = Column(Text, nullable=True)
    english_natural = Column(Text, nullable=True)
    translation_risk = Column(Enum(TranslationRisk), default=TranslationRisk.LOW)
    
    verified = Column(Boolean, default=False)
    verification_score = Column(Integer, nullable=True)
    verification_issues = Column(JSONB, nullable=True)
    needs_review = Column(Boolean, default=False)
    
    # Generated Audio
    tts_audio_path = Column(String(1024), nullable=True)
    tts_duration = Column(Float, nullable=True)
    time_stretch_ratio = Column(Float, default=1.0)
    
    # State
    status = Column(String(50), default="PENDING") # PENDING, PROCESSING, APPROVED, NEEDS_REVIEW, FAILED
    retry_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    job = relationship("PodcastJob", back_populates="segments")
    utterances = relationship("PodcastUtterance", back_populates="segment", cascade="all, delete-orphan")
    facts = relationship("FactEntity", back_populates="segment", cascade="all, delete-orphan")

class PodcastUtterance(Base):
    __tablename__ = "podcast_utterances"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_id = Column(UUID(as_uuid=True), ForeignKey("podcast_segments.id", ondelete="CASCADE"), nullable=False)
    
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    khmer_text = Column(Text, nullable=True)
    english_text = Column(Text, nullable=True)
    
    segment = relationship("PodcastSegment", back_populates="utterances")

class FactEntity(Base):
    __tablename__ = "fact_entities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_id = Column(UUID(as_uuid=True), ForeignKey("podcast_segments.id", ondelete="CASCADE"), nullable=False)
    
    entity_type = Column(String(50), nullable=False) # NUMBER, DATE, TIME, NAME, CURRENCY, UNIT, LOCATION, ORG
    original_value = Column(String(255), nullable=False)
    english_value = Column(String(255), nullable=True)
    is_protected = Column(Boolean, default=False)
    verified_in_english = Column(Boolean, default=False)
    
    segment = relationship("PodcastSegment", back_populates="facts")

class GlossaryEntry(Base):
    __tablename__ = "glossary_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True) # If null, it's a global admin glossary term
    
    khmer_term = Column(String(255), nullable=False, index=True)
    english_term = Column(String(255), nullable=False)
    context_hint = Column(Text, nullable=True)
    is_protected = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class PodcastSummary(Base):
    __tablename__ = "podcast_summaries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("podcast_jobs.id", ondelete="CASCADE"), nullable=False)
    
    summary_type = Column(String(50), nullable=False) # 5_MIN, 15_MIN, EPISODE
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    summary_text = Column(Text, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class ProcessingLog(Base):
    __tablename__ = "processing_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("podcast_jobs.id", ondelete="CASCADE"), nullable=False)
    segment_id = Column(UUID(as_uuid=True), ForeignKey("podcast_segments.id", ondelete="SET NULL"), nullable=True)
    
    stage = Column(String(100), nullable=False)
    model_used = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False)
    duration_ms = Column(Integer, nullable=True)
    details = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    job = relationship("PodcastJob", back_populates="processing_logs")
