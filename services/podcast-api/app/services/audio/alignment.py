"""
Audio Alignment Service.
Uses FFmpeg atempo to adjust the speed of the generated TTS
to match the original segment duration, within acceptable limits
to prevent voice distortion.
"""
import os
import subprocess
import logging
import shutil
from typing import Tuple

logger = logging.getLogger(__name__)

# The maximum we are willing to stretch the audio before it sounds robotic/distorted
# The spec says "Never sacrifice meaning to force timing."
MIN_STRETCH_RATIO = 0.85 # 15% slower
MAX_STRETCH_RATIO = 1.15 # 15% faster (as per step 31)

class AudioAlignmentError(Exception):
    pass

def get_audio_duration(file_path: str) -> float:
    """Uses ffprobe to get the duration of an audio file."""
    cmd = [
        'ffprobe',
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        file_path
    ]
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.returncode == 0 and result.stdout.strip():
            return float(result.stdout.strip())
        return 0.0
    except Exception as e:
        logger.error(f"Failed to get duration for {file_path}: {e}")
        return 0.0

def align_audio_timing(original_duration: float, generated_audio_path: str, output_path: str, match_timing: bool = True) -> Tuple[str, float]:
    """
    Adjusts the generated audio speed to match original_duration.
    Returns (output_path, applied_stretch_ratio).
    """
    if not os.path.exists(generated_audio_path):
        raise AudioAlignmentError("Generated audio file not found.")
        
    generated_duration = get_audio_duration(generated_audio_path)
    
    if generated_duration <= 0:
        raise AudioAlignmentError("Could not determine generated audio duration.")
        
    if not match_timing or original_duration <= 0:
        # Just copy it if we aren't matching timing or if original duration is unknown
        shutil.copy(generated_audio_path, output_path)
        return output_path, 1.0
        
    # Calculate required ratio (generated_duration * ratio = original_duration)
    # Wait, FFmpeg atempo filter works like this:
    # atempo = 2.0 means 2x speed (half duration)
    # So we want atempo = generated_duration / original_duration
    
    target_tempo = generated_duration / original_duration
    
    # Cap the tempo to prevent severe distortion
    actual_tempo = max(MIN_STRETCH_RATIO, min(MAX_STRETCH_RATIO, target_tempo))
    
    if abs(actual_tempo - 1.0) < 0.02:
        # If the difference is less than 2%, don't bother processing
        shutil.copy(generated_audio_path, output_path)
        return output_path, 1.0
        
    logger.info(f"Aligning timing. Original: {original_duration:.2f}s, Generated: {generated_duration:.2f}s. Tempo: {actual_tempo:.2f}x")
    
    try:
        # atempo only supports 0.5 to 100.0, which we are well within.
        cmd = [
            'ffmpeg',
            '-y',
            '-i', generated_audio_path,
            '-filter:a', f'atempo={actual_tempo}',
            output_path
        ]
        
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg atempo failed: {result.stderr}")
            raise AudioAlignmentError("Failed to adjust audio timing.")
            
        return output_path, actual_tempo
        
    except Exception as e:
        logger.error(f"Alignment error: {e}")
        raise AudioAlignmentError(f"Failed to align audio timing: {e}")
