"""
Audio Mixing Service.
Reconstructs the full podcast by combining the individual TTS segments,
preserving the original silence gaps and timestamps.
"""
import os
import subprocess
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class AudioMixerError(Exception):
    pass

def mix_podcast(
    segments_audio: List[Dict[str, Any]], 
    final_duration: float, 
    output_path: str,
    original_audio_path: str = None,
    bilingual: bool = False
) -> str:
    """
    Mixes a list of audio segments into a single file at their precise start times.
    If bilingual is True, overlays the original_audio_path as a background track.
    """
    logger.info(f"Mixing {len(segments_audio)} segments into {output_path} (Bilingual: {bilingual})")
    
    if not segments_audio:
        raise AudioMixerError("No segments provided to mix.")
        
    # Generate the filter graph
    filter_complex = []
    
    # Inputs: 0 to N-1 are English segments. 
    # If bilingual, N is the original Khmer audio.
    
    for i, seg in enumerate(segments_audio):
        delay_ms = int(seg['start_time'] * 1000)
        filter_complex.append(f"[{i}:a]adelay={delay_ms}[a{i}];")
        
    mix_inputs = "".join([f"[a{i}]" for i in range(len(segments_audio))])
    
    if bilingual and original_audio_path:
        # Add the original audio as background, reduced in volume
        orig_idx = len(segments_audio)
        filter_complex.append(f"[{orig_idx}:a]volume=0.15[bg];")
        filter_complex.append(f"{mix_inputs}amix=inputs={len(segments_audio)}:normalize=0[voice];")
        filter_complex.append(f"[voice][bg]amix=inputs=2:normalize=0[out]")
    else:
        filter_complex.append(f"{mix_inputs}amix=inputs={len(segments_audio)}:duration=longest:dropout_transition=0:normalize=0[out]")
    
    filter_graph = "".join(filter_complex)
    
    try:
        script_path = output_path + ".filter.txt"
        with open(script_path, "w") as f:
            f.write(filter_graph)
            
        cmd = ['ffmpeg', '-y']
        for seg in segments_audio:
            cmd.extend(['-i', seg['path']])
            
        if bilingual and original_audio_path:
            cmd.extend(['-i', original_audio_path])
            
        cmd.extend([
            '-filter_complex_script', script_path,
            '-map', '[out]',
            '-ac', '2' if bilingual else '1', # Stereo for bilingual mix
            '-ar', '44100',
            output_path
        ])
        
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Cleanup script
        if os.path.exists(script_path):
            os.remove(script_path)
            
        if result.returncode != 0:
            logger.error(f"FFmpeg mixing failed: {result.stderr}")
            raise AudioMixerError("Failed to mix audio segments.")
            
        # Ensure final duration matches original
        # Pad with silence at the end if needed using apad
        padded_output = output_path.replace(".wav", "_padded.wav")
        pad_cmd = [
            'ffmpeg', '-y',
            '-i', output_path,
            '-af', f'apad=whole_dur={final_duration}',
            padded_output
        ]
        pad_result = subprocess.run(pad_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if pad_result.returncode == 0 and os.path.exists(padded_output):
            os.rename(padded_output, output_path)
            
        logger.info(f"Successfully mixed podcast to {output_path}")
        return output_path
        
    except Exception as e:
        logger.error(f"Error mixing audio: {e}")
        raise AudioMixerError(f"Error mixing audio: {e}")
