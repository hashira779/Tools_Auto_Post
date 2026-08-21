import pytest
from unittest.mock import patch, MagicMock
from uuid import uuid4

from app.models import PodcastJob, PodcastSegment, JobStatus
from app.workers.pipeline import process_podcast_job

@pytest.fixture
def mock_job(db_session):
    job = PodcastJob(
        id=uuid4(),
        title="Test Job",
        original_file_path="/tmp/mock_storage/test.wav",
        original_filename="test.wav",
        source_language="km",
        target_language="en",
        status=JobStatus.QUEUED
    )
    db_session.add(job)
    db_session.commit()
    return job

@patch("app.workers.pipeline.ModelManager")
@patch("app.workers.pipeline.preprocess_audio")
@patch("app.workers.pipeline.transcribe_and_segment")
@patch("app.workers.pipeline.process_translation")
@patch("app.workers.pipeline.verify_and_revise")
@patch("app.workers.pipeline.align_audio_timing")
@patch("app.workers.pipeline.check_audio_quality")
@patch("app.workers.pipeline.mix_podcast")
@patch("app.workers.pipeline.export_job_files")
@patch("app.workers.pipeline.generate_summary")
def test_full_pipeline_success(
    mock_generate_summary,
    mock_export, mock_mix, mock_qc, mock_align,
    mock_verify, mock_translate, mock_transcribe, mock_preprocess,
    MockModelManager, mock_job, db_session
):
    # Setup mocks
    mock_transcribe.return_value = 2 # 2 segments created
    
    # Manually insert 2 segments since the transcriber mock won't do it
    seg1 = PodcastSegment(job_id=mock_job.id, index=0, start_time=0, end_time=10, duration=10, khmer_text="សួស្តី", english_natural="Hello")
    seg2 = PodcastSegment(job_id=mock_job.id, index=1, start_time=10, end_time=20, duration=10, khmer_text="តើអ្នកសុខសប្បាយជាទេ?", english_natural="How are you?")
    db_session.add(seg1)
    db_session.add(seg2)
    db_session.commit()
    
    mock_manager_instance = MockModelManager.return_value
    mock_tts = MagicMock()
    mock_manager_instance.get_tts.return_value = mock_tts
    
    mock_align.return_value = (None, 1.0) # (path, ratio)
    mock_qc.return_value = {"status": "PASS", "issues": []}
    mock_export.return_value = {"english_srt": "/tmp/en.srt", "khmer_srt": "/tmp/km.srt"}
    
    # When
    process_podcast_job(str(mock_job.id))
    
    # Then
    db_session.refresh(mock_job)
    assert mock_job.status == JobStatus.COMPLETED
    assert mock_job.progress_percent == 100
    assert mock_job.final_wav_path is not None
    assert mock_job.english_srt_path == "/tmp/en.srt"
    
    # Verify calls
    mock_preprocess.assert_called_once()
    mock_transcribe.assert_called_once()
    assert mock_translate.call_count == 2
    assert mock_verify.call_count == 2
    assert mock_tts.generate_audio.call_count == 2
    mock_mix.assert_called_once()
    mock_export.assert_called_once()

@patch("app.workers.pipeline.ModelManager")
@patch("app.workers.pipeline.preprocess_audio")
@patch("app.workers.pipeline.transcribe_and_segment")
def test_pipeline_fails_on_empty_audio(
    mock_transcribe, mock_preprocess, MockModelManager, mock_job, db_session
):
    # Setup mock to return 0 segments
    mock_transcribe.return_value = 0
    
    # Run task directly (it should raise Retry or exception)
    from celery.exceptions import Retry
    try:
        process_podcast_job(str(mock_job.id))
    except Retry:
        pass
        
    db_session.refresh(mock_job)
    assert mock_job.status == JobStatus.FAILED
    assert "No speech detected" in mock_job.error_message

@patch("app.workers.pipeline.ModelManager")
@patch("app.workers.pipeline.preprocess_audio")
@patch("app.workers.pipeline.transcribe_and_segment")
@patch("app.workers.pipeline.process_translation")
@patch("app.workers.pipeline.verify_and_revise")
def test_pipeline_strict_verification_pause(
    mock_verify, mock_translate, mock_transcribe, mock_preprocess,
    MockModelManager, mock_job, db_session
):
    # Enable strict mode
    mock_job.strict_verification = True
    db_session.commit()
    
    mock_transcribe.return_value = 1
    seg = PodcastSegment(job_id=mock_job.id, index=0, start_time=0, end_time=10, duration=10, needs_review=True)
    db_session.add(seg)
    db_session.commit()
    
    # Run
    process_podcast_job(str(mock_job.id))
    
    # Verify it pauses at NEEDS_REVIEW
    db_session.refresh(mock_job)
    assert mock_job.status == JobStatus.NEEDS_REVIEW
    assert "Waiting for manual review" in mock_job.current_stage
