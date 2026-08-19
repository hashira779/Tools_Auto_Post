"""
Audio Quality Control Service.
Verifies the generated TTS audio does not contain severe artifacts,
clipping, or excessive silence before accepting it into the final mix.
"""

import subprocess
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class AudioQCError(Exception):
    pass

def check_audio_quality(file_path: str) -> Dict[str, Any]:
    """
    Analyzes an audio file for potential quality issues using FFmpeg's volumedetect.
    Returns a dict with 'status' (PASS/FAIL) and 'issues'.
    """
    issues = []
    
    try:
        # We use FFmpeg's volumedetect filter to check for clipping and RMS levels
        cmd = [
            'ffmpeg',
            '-i', file_path,
            '-af', 'volumedetect',
            '-vn', '-sn', '-dn',
            '-f', 'null',
            'NUL'
        ]
        
        # volumedetect outputs to stderr
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if result.returncode != 0:
            return {"status": "FAIL", "issues": ["FFmpeg failed to analyze audio."]}
            
        # Parse the output
        stderr = result.stderr
        
        max_volume = None
        mean_volume = None
        
        for line in stderr.split('\n'):
            if 'max_volume:' in line:
                try:
                    # e.g., "max_volume: -2.0 dB"
                    parts = line.split('max_volume:')[1].strip().split(' ')
                    max_volume = float(parts[0])
                except Exception:
                    pass
            elif 'mean_volume:' in line:
                try:
                    parts = line.split('mean_volume:')[1].strip().split(' ')
                    mean_volume = float(parts[0])
                except Exception:
                    pass
                    
        # Evaluate rules
        
        # 1. Clipping (max_volume >= 0.0 dB)
        if max_volume is not None and max_volume >= 0.0:
            issues.append(f"Audio is clipping (Max volume: {max_volume} dB)")
            
        # 2. Too quiet (mean_volume < -40.0 dB)
        if mean_volume is not None and mean_volume < -40.0:
            issues.append(f"Audio is extremely quiet (Mean volume: {mean_volume} dB)")
            
        # 3. Completely silent? (mean_volume is missing or very low)
        if mean_volume is None or mean_volume < -70.0:
            issues.append("Audio appears to be completely silent.")
            
        # Optional: check duration matches expected length?
        
    except Exception as e:
        logger.error(f"Error checking audio quality: {str(e)}")
        issues.append(f"QC check failed: {str(e)}")
        
    status = "FAIL" if issues else "PASS"
    return {
        "status": status,
        "issues": issues,
        "max_volume": max_volume,
        "mean_volume": mean_volume
    }
