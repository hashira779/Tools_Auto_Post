"""
Export Service.
Generates SubRip Text (SRT) subtitle files and plain text transcripts
from the database segment records.
"""
import logging
from typing import List
import math

from app.models import PodcastSegment

logger = logging.getLogger(__name__)

def _format_srt_time(seconds: float) -> str:
    """Formats float seconds to SRT timecode HH:MM:SS,mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    msecs = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{msecs:03d}"

def generate_srt(segments: List[PodcastSegment], language: str = "en") -> str:
    """
    Generates an SRT string from the segments.
    language: 'en' for naturalized English, 'km' for original Khmer.
    """
    lines = []
    
    # We sort by index to ensure chronological order
    sorted_segments = sorted(segments, key=lambda s: s.index)
    
    for i, segment in enumerate(sorted_segments, 1):
        start_time = _format_srt_time(segment.start_time)
        end_time = _format_srt_time(segment.end_time)
        
        text = segment.english_natural if language == "en" else segment.khmer_text
        if not text:
            text = "[Blank]"
            
        lines.append(str(i))
        lines.append(f"{start_time} --> {end_time}")
        lines.append(text)
        lines.append("") # Empty line between subtitles
        
    return "\n".join(lines)

def generate_transcript(segments: List[PodcastSegment], language: str = "en") -> str:
    """
    Generates a plain text transcript.
    """
    lines = []
    sorted_segments = sorted(segments, key=lambda s: s.index)
    
    for segment in sorted_segments:
        text = segment.english_natural if language == "en" else segment.khmer_text
        if text:
            lines.append(text)
            
    return "\n\n".join(lines)

def export_job_files(segments: List[PodcastSegment], base_output_path: str) -> dict:
    """
    Writes all required text export files to disk.
    Returns paths to the created files.
    """
    en_srt_path = f"{base_output_path}_en.srt"
    km_srt_path = f"{base_output_path}_km.srt"
    txt_path = f"{base_output_path}_en.txt"
    
    try:
        with open(en_srt_path, "w", encoding="utf-8") as f:
            f.write(generate_srt(segments, "en"))
            
        with open(km_srt_path, "w", encoding="utf-8") as f:
            f.write(generate_srt(segments, "km"))
            
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(generate_transcript(segments, "en"))
            
        logger.info(f"Exported text files to {base_output_path}")
        return {
            "english_srt": en_srt_path,
            "khmer_srt": km_srt_path,
            "english_txt": txt_path
        }
    except Exception as e:
        logger.error(f"Failed to export job files: {e}")
        return {}
