"""Separate vocals from background music using Demucs.

Running alignment on a clean vocal track (instead of a full mix with
instruments) dramatically improves timestamp accuracy for songs with loud
accompaniment.  The separated ``vocals.wav`` is written to the work
directory and can be passed directly to the forced aligner.
"""

from __future__ import annotations

import asyncio
import subprocess
import shutil
from pathlib import Path

from lyrics_srt.errors import SrtGenerationFailed
from lyrics_srt.ffmpeg import ensure_ffmpeg
from utils.logger import get_logger

logger = get_logger("lyrics_srt.vocal_separator")

_DEMUCS_MODEL_CACHE = {}


async def separate_vocals(
    audio_path: Path,
    work_dir: Path,
    model_name: str = "htdemucs",
) -> Path:
    """Isolate vocals from *audio_path* and return the path to ``vocals.wav``.

    The function runs Demucs in a worker thread so it never blocks the
    event loop.  If separation fails for any reason the original
    *audio_path* is returned so the pipeline can continue with the mixed
    audio as a fallback.
    """

    loop = asyncio.get_running_loop()
    try:
        return await loop.run_in_executor(
            None,
            _separate_vocals_sync,
            audio_path,
            work_dir,
            model_name,
        )
    except Exception as exc:
        logger.warning(
            "Vocal separation failed; falling back to original audio: %s",
            exc,
        )
        return audio_path


def _separate_vocals_sync(
    audio_path: Path,
    work_dir: Path,
    model_name: str,
) -> Path:
    """Synchronous vocal separation using the ``demucs`` CLI."""

    ensure_ffmpeg()

    demucs_bin = shutil.which("demucs")
    if demucs_bin is None:
        # Try importing to see if the package exists even without a CLI shim.
        try:
            import demucs  # noqa: F401
        except ImportError:
            raise SrtGenerationFailed(
                "Demucs is not installed.  Run: pip install demucs"
            )
        # Package exists but no CLI entry-point; fall back to python -m.
        demucs_bin = None

    output_dir = work_dir / "demucs_out"
    output_dir.mkdir(parents=True, exist_ok=True)

    cmd: list[str]
    if demucs_bin:
        cmd = [demucs_bin]
    else:
        cmd = ["python", "-m", "demucs"]

    cmd += [
        "--two-stems", "vocals",
        "-n", model_name,
        "-o", str(output_dir),
        str(audio_path),
    ]

    logger.info("Running Demucs: %s", " ".join(cmd))

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600,  # 10 minute hard limit
        )
        if result.returncode != 0:
            logger.error("Demucs stderr: %s", result.stderr)
            raise SrtGenerationFailed(
                f"Demucs exited with code {result.returncode}"
            )
    except subprocess.TimeoutExpired:
        raise SrtGenerationFailed("Demucs timed out after 10 minutes")
    except FileNotFoundError:
        raise SrtGenerationFailed(
            "Demucs is not installed.  Run: pip install demucs"
        )

    # Demucs writes to <output_dir>/<model_name>/<stem_name>/vocals.wav
    stem_name = audio_path.stem  # e.g. "audio"
    vocals_path = output_dir / model_name / stem_name / "vocals.wav"

    if not vocals_path.exists():
        # Try searching for any vocals.wav under the output tree
        candidates = list(output_dir.rglob("vocals.wav"))
        if candidates:
            vocals_path = candidates[0]
        else:
            raise SrtGenerationFailed(
                "Demucs finished but vocals.wav was not found"
            )

    # Copy vocals to the work_dir root for easy access
    final_path = work_dir / "vocals.wav"
    shutil.copy2(str(vocals_path), str(final_path))

    # Clean up the large demucs output tree
    shutil.rmtree(str(output_dir), ignore_errors=True)

    logger.info("Vocal separation complete: %s", final_path)
    return final_path
