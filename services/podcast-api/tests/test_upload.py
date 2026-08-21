import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.models import PodcastJob

def test_upload_missing_file(client: TestClient):
    response = client.post(
        "/api/podcast/upload",
        data={"title": "Test Podcast"}
    )
    assert response.status_code == 422 # FastAPI validation error for missing File

def test_upload_invalid_audio(client: TestClient, db_session):
    # Mock validation failure
    with patch("app.routers.podcast.validate_audio_file") as mock_validate:
        from app.services.audio.validator import AudioValidationError
        mock_validate.side_effect = AudioValidationError("Invalid audio codec")
        
        # Create a dummy file
        files = {"file": ("test.mp3", b"fake audio content", "audio/mpeg")}
        data = {"title": "Test Podcast"}
        
        response = client.post("/api/podcast/upload", files=files, data=data)
        
        assert response.status_code == 400
        assert "Invalid audio codec" in response.json()["detail"]
        
        # Ensure job wasn't persisted or was deleted
        assert db_session.query(PodcastJob).count() == 0

@patch("app.routers.podcast.process_podcast_job.delay")
def test_upload_success(mock_delay, client: TestClient, db_session):
    with patch("app.routers.podcast.validate_audio_file") as mock_validate:
        mock_validate.return_value = {"duration_seconds": 120.0}
        
        files = {"file": ("test.mp3", b"valid audio content", "audio/mpeg")}
        data = {"title": "Test Podcast", "voice_id": "en_US-lessac-medium"}
        
        response = client.post("/api/podcast/upload", files=files, data=data)
        
        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data
        assert data["message"] == "Podcast translation pipeline started."
        
        # Verify job is in database
        job_id = data["job_id"]
        job = db_session.query(PodcastJob).filter(PodcastJob.id == job_id).first()
        assert job is not None
        assert job.title == "Test Podcast"
        assert job.duration_seconds == 120.0
        
        # Verify celery task was triggered
        mock_delay.assert_called_once_with(str(job_id))

@patch("app.routers.podcast.process_podcast_job.delay")
@patch("app.routers.podcast.download_audio")
def test_upload_url_success(mock_download, mock_delay, client: TestClient, db_session):
    with patch("app.routers.podcast.validate_audio_file") as mock_validate, \
         patch("shutil.copy2"), patch("app.routers.podcast.cleanup_audio"):
         
        mock_validate.return_value = {"duration_seconds": 300.0}
        
        # Mock download return
        mock_file = MagicMock()
        mock_file.name = "downloaded_video.mp4"
        mock_file.suffix = ".mp4"
        mock_download.return_value = (mock_file, {"title": "YouTube Video Title"})
        
        req_data = {
            "url": "https://youtube.com/watch?v=123",
            "title": "URL Podcast",
            "voice_id": "en_US-lessac-medium",
            "strict_verification": True
        }
        
        response = client.post("/api/podcast/upload-url", json=req_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data
        
        job_id = data["job_id"]
        job = db_session.query(PodcastJob).filter(PodcastJob.id == job_id).first()
        assert job is not None
        assert job.title == "URL Podcast"
        assert job.strict_verification is True
        
        mock_delay.assert_called_once_with(str(job_id))
