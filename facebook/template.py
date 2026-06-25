"""
Video template engine using FFmpeg.
Applies logo/text overlays and watermarks to downloaded videos.
"""

import os
import subprocess
from pathlib import Path

from utils.logger import get_logger

logger = get_logger("facebook.template")


def apply_watermark(
    input_path: str,
    output_path: str,
    watermark_path: str = None,
    watermark_text: str = None,
    position: str = "bottom_right",
    opacity: float = 0.7,
    scale: float = 0.15,
) -> bool:
    """
    Apply a watermark (image or text) to a video using FFmpeg.

    Args:
        input_path: Path to input video
        output_path: Path to save output video
        watermark_path: Path to PNG watermark image (optional)
        watermark_text: Text to overlay (optional, used if no watermark_path)
        position: Where to place watermark: 'top_left', 'top_right', 'bottom_left', 'bottom_right', 'center'
        opacity: Watermark opacity (0.0 to 1.0)
        scale: Watermark scale relative to video width (0.0 to 1.0)

    Returns:
        True if successful, False otherwise
    """
    if not os.path.exists(input_path):
        logger.error(f"Input file not found: {input_path}")
        return False

    try:
        if watermark_path and os.path.exists(watermark_path):
            return _apply_image_watermark(input_path, output_path, watermark_path, position, opacity, scale)
        elif watermark_text:
            return _apply_text_watermark(input_path, output_path, watermark_text, position, opacity)
        else:
            return _ensure_high_quality(input_path, output_path)

    except Exception as e:
        logger.exception(f"Failed to apply watermark or process video: {e}")
        return False

def _ensure_high_quality(input_path: str, output_path: str) -> bool:
    """Ensure video is at least 720p and high quality H.264."""
    logger.info(f"🎨 Processing video quality (minimum 720p): {input_path}")
    
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", "scale=-2:'max(ih,720)'",
        "-c:a", "copy",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        output_path,
    ]

    logger.debug(f"FFmpeg command: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

    if result.returncode == 0:
        logger.info(f"✅ Video processed successfully: {output_path}")
        return True
    else:
        logger.error(f"❌ FFmpeg error: {result.stderr[-500:]}")
        return False


def _get_position_overlay(position: str, pad: int = 20) -> str:
    """Get FFmpeg overlay position string."""
    positions = {
        "top_left": f"x={pad}:y={pad}",
        "top_right": f"x=W-w-{pad}:y={pad}",
        "bottom_left": f"x={pad}:y=H-h-{pad}",
        "bottom_right": f"x=W-w-{pad}:y=H-h-{pad}",
        "center": "x=(W-w)/2:y=(H-h)/2",
    }
    return positions.get(position, positions["bottom_right"])


def _apply_image_watermark(
    input_path: str,
    output_path: str,
    watermark_path: str,
    position: str,
    opacity: float,
    scale: float,
) -> bool:
    """Apply a PNG image watermark to a video."""
    logger.info(f"🎨 Applying image watermark: {watermark_path}")

    pos = _get_position_overlay(position)

    # Build FFmpeg filter:
    # 1. Scale video to minimum 720p
    # 2. Scale watermark relative to video width
    # 3. Set opacity
    # 4. Overlay at specified position
    filter_complex = (
        f"[0:v]scale=-2:'max(ih,720)'[scaled_vid];"
        f"[1:v]scale=iw*{scale}:-1,format=rgba,"
        f"colorchannelmixer=aa={opacity}[watermark];"
        f"[scaled_vid][watermark]overlay={pos}"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-i", watermark_path,
        "-filter_complex", filter_complex,
        "-c:a", "copy",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",  # High quality visually lossless
        output_path,
    ]

    logger.debug(f"FFmpeg command: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

    if result.returncode == 0:
        logger.info(f"✅ Watermark applied successfully: {output_path}")
        return True
    else:
        logger.error(f"❌ FFmpeg error: {result.stderr[-500:]}")
        return False


def _apply_text_watermark(
    input_path: str,
    output_path: str,
    text: str,
    position: str,
    opacity: float,
) -> bool:
    """Apply a text watermark to a video."""
    logger.info(f"🎨 Applying text watermark: '{text}'")

    # Position mapping for drawtext filter
    text_positions = {
        "top_left": "x=20:y=20",
        "top_right": "x=w-tw-20:y=20",
        "bottom_left": "x=20:y=h-th-20",
        "bottom_right": "x=w-tw-20:y=h-th-20",
        "center": "x=(w-tw)/2:y=(h-th)/2",
    }
    pos = text_positions.get(position, text_positions["bottom_right"])

    # Escape special characters for FFmpeg
    escaped_text = text.replace("'", "'\\''").replace(":", "\\:")

    filter_str = (
        f"scale=-2:'max(ih,720)',"
        f"drawtext=text='{escaped_text}':"
        f"fontsize=36:fontcolor=white@{opacity}:"
        f"borderw=2:bordercolor=black@{opacity * 0.5}:"
        f"{pos}"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", filter_str,
        "-c:a", "copy",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",  # High quality visually lossless
        output_path,
    ]

    logger.debug(f"FFmpeg command: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

    if result.returncode == 0:
        logger.info(f"✅ Text watermark applied successfully: {output_path}")
        return True
    else:
        logger.error(f"❌ FFmpeg error: {result.stderr[-500:]}")
        return False

def replace_audio(
    video_path: str,
    audio_path: str,
    output_path: str,
) -> bool:
    """Replace a video's audio with a new audio file using FFmpeg."""
    logger.info(f"🎵 Replacing audio in {video_path} with {audio_path}")

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-stream_loop", "-1",
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        output_path,
    ]

    logger.debug(f"FFmpeg command: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

    if result.returncode == 0:
        logger.info(f"✅ Audio replaced successfully: {output_path}")
        return True
    else:
        logger.error(f"❌ FFmpeg error replacing audio: {result.stderr[-500:]}")
        return False
