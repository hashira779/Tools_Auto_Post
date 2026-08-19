"""
Audio validation service.
Validates uploads before they enter the processing pipeline.
"""
import os
import subprocess
import json
import mimetypes
from typing import Dict, Any, Tuple
from app.config import config

ALLOWED_EXTENSIONS = {'.mp3', '.wav', '.m4a', '.flac', '.mp4'}
ALLOWED_MIME_TYPES = {
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/x-m4a',
    'audio/flac',
    'audio/x-flac',
    'video/mp4'
}

class AudioValidationError(Exception):
    """Exception raised for invalid audio files."""
    pass

def validate_audio_file(file_path: str, original_filename: str) -> Dict[str, Any]:
    """
    Validates the audio file.
    Raises AudioValidationError if validation fails.
    Returns metadata if successful.
    """
    if not os.path.exists(file_path):
        raise AudioValidationError("File does not exist.")
    
    # 1. Check size
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb > config.MAX_FILE_SIZE_MB:
        raise AudioValidationError(f"File size ({size_mb:.1f} MB) exceeds maximum allowed ({config.MAX_FILE_SIZE_MB} MB).")
    if size_mb == 0:
        raise AudioValidationError("File is empty.")
    
    # 2. Check extension
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise AudioValidationError(f"File extension '{ext}' is not supported. Use MP3, WAV, M4A, FLAC, or MP4.")
    
    # 3. Use ffprobe to validate codec, duration, and corruption
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration:stream=codec_type,codec_name,sample_rate,channels',
            '-of', 'json',
            file_path
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
        
        if result.returncode != 0:
            raise AudioValidationError("File is corrupted or not a valid media file.")
            
        probe_data = json.loads(result.stdout)
    except subprocess.TimeoutExpired:
        raise AudioValidationError("ffprobe timed out analyzing the file.")
    except Exception as e:
        raise AudioValidationError(f"Failed to analyze file: {str(e)}")
        
    # 4. Verify streams
    streams = probe_data.get('streams', [])
    if not streams:
        raise AudioValidationError("No streams found in the file.")
        
    audio_streams = [s for s in streams if s.get('codec_type') == 'audio']
    if not audio_streams:
        raise AudioValidationError("No audio stream found in the file.")
        
    main_audio = audio_streams[0]
    
    # 5. Check duration
    format_info = probe_data.get('format', {})
    duration_str = format_info.get('duration')
    if not duration_str:
        raise AudioValidationError("Could not determine audio duration.")
        
    duration_sec = float(duration_str)
    duration_min = duration_sec / 60.0
    
    if duration_min > config.MAX_DURATION_MINUTES:
        raise AudioValidationError(f"Audio duration ({duration_min:.1f} min) exceeds maximum allowed ({config.MAX_DURATION_MINUTES} min).")
        
    if duration_sec < config.SEGMENT_MIN_SECONDS:
        raise AudioValidationError(f"Audio is too short. Minimum duration is {config.SEGMENT_MIN_SECONDS} seconds.")
        
    # 6. Extract metadata for preprocessing
    metadata = {
        'duration_seconds': duration_sec,
        'codec': main_audio.get('codec_name'),
        'sample_rate': main_audio.get('sample_rate'),
        'channels': main_audio.get('channels'),
        'size_mb': size_mb
    }
    
    return metadata
