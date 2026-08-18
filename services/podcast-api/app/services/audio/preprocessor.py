"""
Audio Preprocessing Service.
Converts input audio into a standardized format for the AI pipeline.
Specifically: 16kHz, mono, WAV format, normalized volume.
"""

import os
import subprocess
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class AudioPreprocessingError(Exception):
    """Exception raised during FFmpeg preprocessing."""
    pass

def preprocess_audio(input_path: str, output_path: str) -> str:
    """
    Preprocesses the audio file for Whisper and VAD.
    - Converts to 16kHz (required by Whisper)
    - Converts to Mono (1 channel)
    - Normalizes volume (loudnorm)
    - Exports as WAV
    
    Returns the path to the preprocessed audio file.
    """
    logger.info(f"Preprocessing audio: {input_path}")
    
    if not os.path.exists(input_path):
        raise AudioPreprocessingError(f"Input file not found: {input_path}")
        
    try:
        # We use the 'loudnorm' filter to ensure consistent volume levels,
        # which helps VAD and Whisper perform better across diverse podcast sources.
        cmd = [
            'ffmpeg',
            '-y',  # Overwrite output
            '-i', input_path,
            '-vn', # No video
            '-acodec', 'pcm_s16le', # 16-bit PCM
            '-ar', '16000', # 16kHz sample rate
            '-ac', '1', # Mono
            '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', # EBU R128 loudness normalization
            output_path
        ]
        
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg error: {result.stderr}")
            raise AudioPreprocessingError("FFmpeg failed to preprocess the audio.")
            
        if not os.path.exists(output_path):
            raise AudioPreprocessingError("Output file was not created by FFmpeg.")
            
        logger.info(f"Audio preprocessed successfully: {output_path}")
        return output_path
        
    except Exception as e:
        logger.error(f"Preprocessing failed: {str(e)}")
        raise AudioPreprocessingError(f"Failed to preprocess audio: {str(e)}")

def extract_segment(input_path: str, output_path: str, start_time: float, end_time: float) -> str:
    """
    Extracts a specific segment from an audio file.
    """
    try:
        cmd = [
            'ffmpeg',
            '-y',
            '-i', input_path,
            '-ss', str(start_time),
            '-to', str(end_time),
            '-c', 'copy', # Fast copy without re-encoding (assumes already WAV)
            output_path
        ]
        
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if result.returncode != 0:
            raise AudioPreprocessingError("FFmpeg failed to extract the segment.")
            
        return output_path
        
    except Exception as e:
        raise AudioPreprocessingError(f"Failed to extract segment: {str(e)}")
