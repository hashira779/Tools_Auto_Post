import os
import logging
from uuid import UUID
from celery import shared_task

from app.database import SessionLocal
from app.models import PodcastJob, JobStatus, PodcastSegment
from app.providers.manager import ModelManager

# Services
from app.services.audio.preprocessor import preprocess_audio
from app.services.transcription.transcriber import transcribe_and_segment
from app.services.context.context_manager import ContextManager
from app.services.context.summary_manager import generate_summary
from app.services.translation.translator import process_translation
from app.services.verification.semantic_verifier import verify_and_revise
from app.services.audio.alignment import align_audio_timing
from app.services.audio.quality import check_audio_quality
from app.services.audio.mixer import mix_podcast
from app.services.transcription.export import export_job_files

logger = logging.getLogger(__name__)

def update_job_status(db, job: PodcastJob, status: JobStatus, progress: int, stage: str, error: str = None):
    job.status = status
    job.progress_percent = progress
    job.current_stage = stage
    if error:
        job.error_message = error
    db.commit()

@shared_task(bind=True, max_retries=3)
def process_podcast_job(self, job_id_str: str):
    """
    The main Celery task that orchestrates the entire pipeline.
    """
    job_id = UUID(job_id_str)
    db = SessionLocal()
    job = db.query(PodcastJob).filter(PodcastJob.id == job_id).first()
    
    if not job:
        logger.error(f"Job {job_id} not found.")
        db.close()
        return
        
    try:
        model_manager = ModelManager()
        
        # 1. Preprocessing
        update_job_status(db, job, JobStatus.PREPROCESSING, 5, "Preprocessing audio")
        preprocessed_audio_path = os.path.splitext(job.original_file_path)[0] + "_16k.wav"
        preprocess_audio(job.original_file_path, preprocessed_audio_path)
        
        # 2. Transcription & Segmentation
        update_job_status(db, job, JobStatus.TRANSCRIBING, 15, "Transcribing Khmer audio")
        with model_manager.use_asr() as asr:
            segment_count = transcribe_and_segment(db, job_id, preprocessed_audio_path, asr)
            
        if segment_count == 0:
            raise ValueError("No speech detected in audio.")
            
        # 2b. Speaker & Prosody Analysis (Experimental)
        update_job_status(db, job, JobStatus.ANALYZING, 35, "Analyzing speaker and prosody")
        segments = db.query(PodcastSegment).filter(PodcastSegment.job_id == job_id).order_by(PodcastSegment.index.asc()).all()
        speaker_analyzer = model_manager.get_speaker_analyzer()
        prosody_analyzer = model_manager.get_prosody_analyzer()
        
        for segment in segments:
            # Diarization (placeholder)
            # In a real setup, we would run this on the whole file or per segment
            # For now, we just assign the default speaker
            segment.speaker_id = "SPEAKER_01"
            
            # Prosody analysis
            prosody_data = prosody_analyzer.analyze(preprocessed_audio_path, segment.start_time, segment.end_time)
            # We could store prosody data in a new field or JSONB, but for MVP we just log it
            # segment.prosody_data = prosody_data 
            
        db.commit()
            
        # 3. Translation Pipeline
        update_job_status(db, job, JobStatus.TRANSLATING, 40, "Translating to English")
        segments = db.query(PodcastSegment).filter(PodcastSegment.job_id == job_id).order_by(PodcastSegment.index.asc()).all()
        
        context_manager = ContextManager(db, str(job_id))
        llm = model_manager.get_llm()
        
        with model_manager.use_translation() as translator:
            for i, segment in enumerate(segments):
                # Process translation
                process_translation(db, segment, translator, llm, context_manager, str(job.user_id) if job.user_id else None)
                
                # Generate summaries every 5 minutes (approx every 10-15 segments)
                if i > 0 and i % 12 == 0:
                    generate_summary(db, str(job_id), segments[i-12].start_time, segment.end_time, "5_MIN", llm)
                    
                # Update progress roughly
                prog = 40 + int((i / len(segments)) * 20)
                update_job_status(db, job, JobStatus.TRANSLATING, prog, f"Translating segment {i+1}/{len(segments)}")

        # 4. Verification
        update_job_status(db, job, JobStatus.VERIFYING, 65, "Verifying semantics")
        for i, segment in enumerate(segments):
            verify_and_revise(db, segment, llm, context_manager)
            
        # If strict mode and any segment failed, pause for review
        if job.strict_verification:
            failed_segments = [s for s in segments if s.needs_review]
            if failed_segments:
                update_job_status(db, job, JobStatus.NEEDS_REVIEW, 70, f"Waiting for review on {len(failed_segments)} segments")
                db.close()
                return # Pipeline halts here until API resumes it

        # 5. Voice Generation
        update_job_status(db, job, JobStatus.GENERATING_VOICE, 75, "Generating English audio")
        tts = model_manager.get_tts()
        
        mixed_segments_info = []
        for i, segment in enumerate(segments):
            # 5a. TTS
            tts_path = f"/app/storage/{job_id}_seg_{i}.wav"
            text_to_speak = segment.english_natural or segment.english_raw
            if text_to_speak:
                tts.generate_audio(text_to_speak, tts_path, job.voice_id)
                segment.tts_audio_path = tts_path
                
                # 5b. Timing Analysis & Alignment (Step 31)
                tts_duration = align_audio_timing(0, tts_path, tts_path + ".tmp.wav", False)[1] # Just get duration
                from app.services.audio.alignment import get_audio_duration
                tts_duration = get_audio_duration(tts_path)
                
                # If too long (>15% longer), try concise rewrite
                if tts_duration > segment.duration * 1.15:
                    logger.info(f"Segment {i} is too long ({tts_duration:.2f}s vs {segment.duration:.2f}s). Attempting concise rewrite.")
                    concise_prompt = f"The following English text is too long to fit in its allotted time of {segment.duration:.2f} seconds. Please rewrite it to be more concise while preserving all meaning, facts, and conversational tone.\n\nText: {text_to_speak}"
                    concise_text = llm.generate(prompt=concise_prompt, system_prompt="You are a professional podcast editor. Be concise.")
                    if concise_text:
                        segment.english_natural = concise_text.strip(' \n"\'-')
                        text_to_speak = segment.english_natural
                        tts.generate_audio(text_to_speak, tts_path, job.voice_id)
                
                # Final alignment with time-stretching
                aligned_path = f"/app/storage/{job_id}_seg_{i}_aligned.wav"
                _, ratio = align_audio_timing(segment.duration, tts_path, aligned_path, job.match_original_timing)
                segment.time_stretch_ratio = ratio
                
                # 5c. QC
                qc_result = check_audio_quality(aligned_path)
                if qc_result["status"] == "FAIL":
                    logger.warning(f"Audio QC failed for seg {i}: {qc_result['issues']}")
                    # If it severely fails, we might just use the original TTS or flag it
                    
                mixed_segments_info.append({
                    "path": aligned_path,
                    "start_time": segment.start_time
                })
        db.commit()

        # 6. Mixing
        update_job_status(db, job, JobStatus.MIXING, 90, "Mixing final audio")
        final_wav_path = f"/app/storage/{job_id}_final.wav"
        mix_podcast(mixed_segments_info, job.duration_seconds or segments[-1].end_time, final_wav_path)
        job.final_wav_path = final_wav_path
        
        # 7. Export SRT
        update_job_status(db, job, JobStatus.QUALITY_CHECK, 95, "Generating subtitles")
        exports = export_job_files(segments, f"/app/storage/{job_id}")
        if "english_srt" in exports:
            job.english_srt_path = exports["english_srt"]
        if "khmer_srt" in exports:
            job.original_srt_path = exports["khmer_srt"]

        # DONE
        update_job_status(db, job, JobStatus.COMPLETED, 100, "Done")
        logger.info(f"Job {job_id} completed successfully.")
        
    except Exception as e:
        logger.exception(f"Pipeline failed for job {job_id}")
        update_job_status(db, job, JobStatus.FAILED, job.progress_percent, "Failed", str(e))
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()
