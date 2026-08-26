import os
import shutil
import logging
from uuid import UUID
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, Body
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models import PodcastJob, JobStatus, PodcastSegment
from app.auth import get_verified_user, User
from app.services.audio.validator import validate_audio_file, AudioValidationError
from app.workers.celery_app import celery_app
from app.workers.pipeline import process_podcast_job
from app.providers.manager import ModelManager
from app.services.audio.alignment import align_audio_timing

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/podcast", tags=["podcast"])

STORAGE_DIR = "/app/storage"
os.makedirs(STORAGE_DIR, exist_ok=True)

@router.get("/health")
async def health_check():
    """
    Health check endpoint for the podcast service.
    """
    return {"status": "ok", "service": "podcast-api"}

@router.post("/upload")
async def upload_podcast(
    file: UploadFile = File(...),
    title: str = Form(...),
    voice_id: str = Form(default="en_US-lessac-medium"),
    strict_verification: bool = Form(default=False),
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db)
):
    """
    Uploads a Khmer podcast and starts the translation/dubbing pipeline.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
        
    # Create DB Job to get UUID
    job = PodcastJob(
        title=title,
        user_id=user.id,
        original_filename=file.filename,
        voice_id=voice_id,
        strict_verification=strict_verification,
        original_file_path="" # Will update after save
    )
    db.add(job)
    db.flush()
    
    # Save file
    file_ext = os.path.splitext(file.filename)[1]
    safe_path = os.path.join(STORAGE_DIR, f"{job.id}_original{file_ext}")
    
    try:
        with open(safe_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Validate audio
        metadata = validate_audio_file(safe_path, file.filename)
        
        job.original_file_path = safe_path
        job.duration_seconds = metadata.get("duration_seconds")
        db.commit()
        
    except AudioValidationError as e:
        os.remove(safe_path)
        db.delete(job)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if os.path.exists(safe_path):
            os.remove(safe_path)
        db.delete(job)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {e}")
        
    # Trigger Celery Task
    process_podcast_job.delay(str(job.id))
    
    return {
        "job_id": job.id,
        "message": "Podcast translation pipeline started.",
        "duration_seconds": job.duration_seconds
    }

from app.services.ytdlp_service import download_audio, cleanup_audio
from pydantic import BaseModel

class UrlUploadRequest(BaseModel):
    url: str
    title: str = ""
    voice_id: str = "en_US-lessac-medium"
    strict_verification: bool = False

@router.post("/upload-url")
async def upload_podcast_url(
    req: UrlUploadRequest,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db)
):
    """
    Downloads audio from a given URL (YouTube, TikTok, etc.) and starts the pipeline.
    """
    if not req.url:
        raise HTTPException(status_code=400, detail="No URL provided")
        
    # Download audio synchronously
    try:
        downloaded_file, info = download_audio(req.url)
        if not downloaded_file:
            raise HTTPException(status_code=400, detail="Could not download audio from the provided URL")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Download failed: {str(e)}")

    final_title = req.title or info.get("title", "Imported Podcast")
    
    # Create DB Job
    job = PodcastJob(
        title=final_title,
        user_id=user.id,
        original_filename=downloaded_file.name,
        voice_id=req.voice_id,
        strict_verification=req.strict_verification,
        original_file_path="" 
    )
    db.add(job)
    db.flush()
    
    # Move file to permanent storage
    file_ext = downloaded_file.suffix
    safe_path = os.path.join(STORAGE_DIR, f"{job.id}_original{file_ext}")
    
    try:
        shutil.copy2(downloaded_file, safe_path)
        cleanup_audio(downloaded_file)
        
        # Validate audio
        metadata = validate_audio_file(safe_path, downloaded_file.name)
        
        job.original_file_path = safe_path
        job.duration_seconds = metadata.get("duration_seconds")
        db.commit()
        
    except AudioValidationError as e:
        if os.path.exists(safe_path):
            os.remove(safe_path)
        db.delete(job)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        err_details = traceback.format_exc()
        if os.path.exists(safe_path):
            os.remove(safe_path)
        db.delete(job)
        db.commit()
        raise HTTPException(status_code=400, detail=f"Failed to process download: {type(e).__name__} - {str(e)} | TRACE: {err_details}")
        
    # Trigger Celery Task
    try:
        process_podcast_job.apply_async(args=[str(job.id)], queue='podcast')
    except Exception as e:
        import traceback
        logger.error(f"Failed to queue celery task: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Audio processed successfully, but failed to start translation pipeline: {str(e)}")
        
    return {
        "job_id": job.id,
        "message": "Podcast translation pipeline started from URL.",
        "duration_seconds": job.duration_seconds
    }

@router.post("/test-upload-url")
async def test_upload_podcast_url(req: UrlUploadRequest, db: Session = Depends(get_db)):
    """TEMPORARY endpoint to debug the 500/400 error without auth."""
    # Download audio synchronously
    try:
        downloaded_file, info = download_audio(req.url)
        if not downloaded_file:
            raise HTTPException(status_code=400, detail="Could not download audio from the provided URL")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Download failed: {str(e)}")

    final_title = req.title or info.get("title", "Imported Podcast")
    
    # Create DB Job
    job = PodcastJob(
        title=final_title,
        # Use a dummy UUID for the user_id since we bypassed auth
        user_id="9ee0b897-5abd-4c03-b166-14ccb5ecedf8",
        original_filename=downloaded_file.name,
        voice_id=req.voice_id,
        strict_verification=req.strict_verification,
        original_file_path="" 
    )
    db.add(job)
    db.flush()
    
    # Move file to permanent storage
    file_ext = downloaded_file.suffix
    safe_path = os.path.join(STORAGE_DIR, f"{job.id}_original{file_ext}")
    
    try:
        shutil.copy2(downloaded_file, safe_path)
        cleanup_audio(downloaded_file)
        
        # Validate audio
        metadata = validate_audio_file(safe_path, downloaded_file.name)
        
        job.original_file_path = safe_path
        job.duration_seconds = metadata.get("duration_seconds")
        db.commit()
        
    except AudioValidationError as e:
        if os.path.exists(safe_path):
            os.remove(safe_path)
        db.delete(job)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        err_details = traceback.format_exc()
        if os.path.exists(safe_path):
            os.remove(safe_path)
        db.delete(job)
        db.commit()
        raise HTTPException(status_code=400, detail=f"Failed to process download: {type(e).__name__} - {str(e)} | TRACE: {err_details}")
        
    return {"message": "Success"}

@router.get("/status/{job_id}")
def get_job_status(job_id: UUID, user: User = Depends(get_verified_user), db: Session = Depends(get_db)):
    """
    Returns the current status of the podcast job.
    """
    job = db.query(PodcastJob).filter(PodcastJob.id == job_id, PodcastJob.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "job_id": job.id,
        "status": job.status,
        "progress_percent": job.progress_percent,
        "current_stage": job.current_stage,
        "error_message": job.error_message
    }

import asyncio
import json
from fastapi.responses import StreamingResponse, FileResponse

@router.get("/stream/{job_id}")
async def stream_job_status(job_id: UUID, user: User = Depends(get_verified_user), db: Session = Depends(get_db)):
    """
    Server-Sent Events (SSE) endpoint for real-time progress updates.
    """
    async def event_generator():
        last_progress = -1
        while True:
            # Re-fetch job to get latest status
            # Note: In a real high-traffic app, we would use Redis Pub/Sub here
            # instead of polling the DB. For MVP, polling is okay.
            db_session = SessionLocal()
            job = db_session.query(PodcastJob).filter(PodcastJob.id == job_id, PodcastJob.user_id == user.id).first()
            db_session.close()
            
            if not job:
                yield f"data: {json.dumps({'error': 'Job not found'})}\n\n"
                break
                
            if job.progress_percent != last_progress:
                last_progress = job.progress_percent
                data = {
                    "job_id": str(job.id),
                    "status": job.status.value,
                    "progress_percent": job.progress_percent,
                    "current_stage": job.current_stage
                }
                yield f"data: {json.dumps(data)}\n\n"
                
            if job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.NEEDS_REVIEW]:
                break
                
            await asyncio.sleep(2)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/download/{job_id}/{file_type}")
def download_file(job_id: UUID, file_type: str, user: User = Depends(get_verified_user), db: Session = Depends(get_db)):
    """
    Downloads the final output files (wav, mp3, en_srt, km_srt).
    """
    job = db.query(PodcastJob).filter(PodcastJob.id == job_id, PodcastJob.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    file_map = {
        "wav": job.final_wav_path,
        "mp3": job.final_mp3_path, # If we implemented mp3 conversion
        "en_srt": job.english_srt_path,
        "km_srt": job.original_srt_path
    }
    
    file_path = file_map.get(file_type)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File {file_type} not available")
        
    # Return as attachment
    filename = f"{job.title.replace(' ', '_')}_{file_type}.{file_path.split('.')[-1]}"
    return FileResponse(path=file_path, filename=filename, media_type="application/octet-stream")

@router.post("/resume/{job_id}")
def resume_podcast(job_id: UUID, user: User = Depends(get_verified_user), db: Session = Depends(get_db)):
    """
    Resumes a job that was paused for review.
    """
    job = db.query(PodcastJob).filter(PodcastJob.id == job_id, PodcastJob.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != JobStatus.NEEDS_REVIEW:
        raise HTTPException(status_code=400, detail=f"Job is in {job.status} status, cannot resume.")
    
    # We set strict_verification to False for the resume to ensure it continues even if some segments still have review flag
    job.strict_verification = False
    job.status = JobStatus.QUEUED
    db.commit()
    
    process_podcast_job.delay(str(job.id))
    
    return {"message": "Pipeline resumed successfully."}

@router.get("/jobs/{job_id}/segments")
def get_job_segments(job_id: UUID, user: User = Depends(get_verified_user), db: Session = Depends(get_db)):
    """
    Returns all segments for a specific job.
    """
    job = db.query(PodcastJob).filter(PodcastJob.id == job_id, PodcastJob.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    segments = db.query(PodcastSegment).filter(PodcastSegment.job_id == job_id).order_by(PodcastSegment.index.asc()).all()
    return segments

@router.patch("/jobs/{job_id}/segments/{segment_id}")
def update_segment(
    job_id: UUID, 
    segment_id: UUID, 
    data: dict = Body(...), 
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db)
):
    """
    Updates a specific segment's text or timing parameters.
    """
    job = db.query(PodcastJob).filter(PodcastJob.id == job_id, PodcastJob.user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    segment = db.query(PodcastSegment).filter(
        PodcastSegment.id == segment_id,
        PodcastSegment.job_id == job_id
    ).first()
    
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
        
    if "english_natural" in data:
        segment.english_natural = data["english_natural"]
        segment.verified = True # Manually edited counts as verified
        segment.needs_review = False
        
    if "time_stretch_ratio" in data:
        segment.time_stretch_ratio = data["time_stretch_ratio"]
        
    db.commit()
    return {"message": "Segment updated successfully."}

@router.post("/jobs/{job_id}/segments/{segment_id}/regenerate")
def regenerate_segment_audio(
    job_id: UUID,
    segment_id: UUID,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db)
):
    """
    Regenerates the TTS audio for a single segment.
    """
    job = db.query(PodcastJob).filter(PodcastJob.id == job_id, PodcastJob.user_id == user.id).first()
    segment = db.query(PodcastSegment).filter(
        PodcastSegment.id == segment_id,
        PodcastSegment.job_id == job_id
    ).first()
    
    if not segment or not job:
        raise HTTPException(status_code=404, detail="Segment or Job not found")
        
    try:
        model_manager = ModelManager()
        tts = model_manager.get_tts()
        
        # 1. Generate TTS
        tts_path = f"{STORAGE_DIR}/{job.id}_seg_{segment.index}.wav"
        text_to_speak = segment.english_natural or segment.english_raw
        if not text_to_speak:
            raise HTTPException(status_code=400, detail="No text to speak")
            
        tts.generate_audio(text_to_speak, tts_path, job.voice_id)
        
        # 2. Re-align timing
        aligned_path = f"{STORAGE_DIR}/{job.id}_seg_{segment.index}_aligned.wav"
        align_audio_timing(segment.duration, tts_path, aligned_path, job.match_original_timing)
        
        segment.tts_audio_path = aligned_path
        db.commit()
        
        return {"message": "Audio regenerated successfully."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regeneration failed: {str(e)}")

