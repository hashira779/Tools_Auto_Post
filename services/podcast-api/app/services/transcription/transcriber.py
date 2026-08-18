"""
Transcription Service.
Orchestrates the ASR provider, smart segmentation, and database persistence.
"""
import logging
from sqlalchemy.orm import Session
from uuid import UUID

from app.providers.asr.faster_whisper_provider import FasterWhisperProvider
from app.services.audio.segmenter import group_utterances_into_segments
from app.models import PodcastSegment, PodcastUtterance, PodcastJob

logger = logging.getLogger(__name__)

def transcribe_and_segment(db: Session, job_id: UUID, audio_path: str, provider: FasterWhisperProvider) -> int:
    """
    Transcribes the audio file, segments it, and saves it to the database.
    Returns the total number of segments created.
    """
    job = db.query(PodcastJob).filter(PodcastJob.id == job_id).first()
    if not job:
        raise ValueError(f"Job {job_id} not found.")
        
    logger.info(f"Starting transcription for job {job_id}")
    
    # 1. Transcribe (Pass 1: VAD + Segment timestamps)
    utterances = provider.transcribe(audio_path, language=job.source_language, pass_type=1)
    
    if not utterances:
        logger.warning(f"No speech detected in {audio_path}")
        return 0
        
    # 2. Smart Segmentation (Group short utterances into 30-45s chunks)
    smart_segments = group_utterances_into_segments(utterances)
    logger.info(f"Grouped into {len(smart_segments)} smart segments.")
    
    # 3. Persist to DB
    segment_count = 0
    for seg_data in smart_segments:
        # Create Segment
        db_segment = PodcastSegment(
            job_id=job_id,
            index=seg_data['index'],
            start_time=seg_data['start'],
            end_time=seg_data['end'],
            duration=seg_data['duration'],
            khmer_text=seg_data['text'],
            asr_confidence=1.0, # Could average out utterance confidences
            status="PENDING"
        )
        db.add(db_segment)
        db.flush() # Get segment ID
        
        # Create Utterances
        for utt in seg_data['utterances']:
            db_utterance = PodcastUtterance(
                segment_id=db_segment.id,
                start_time=utt['start'],
                end_time=utt['end'],
                khmer_text=utt['text']
            )
            db.add(db_utterance)
            
        segment_count += 1
        
    db.commit()
    logger.info(f"Successfully persisted {segment_count} segments to DB for job {job_id}")
    return segment_count
