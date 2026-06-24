"""FFmpeg discovery helpers.

The project can use a system FFmpeg, or the binary bundled by imageio-ffmpeg.
Whisper invokes an executable named "ffmpeg", so this module creates a small
runtime shim when only imageio-ffmpeg is available.
"""

from __future__ import annotations

import os
import shutil
import stat
import tempfile
from pathlib import Path


def ensure_ffmpeg() -> str:
    """Return an FFmpeg executable path and make `ffmpeg` discoverable."""

    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg

    try:
        import imageio_ffmpeg
    except Exception as exc:  # pragma: no cover - depends on local install
        raise RuntimeError(
            "FFmpeg is required. Install ffmpeg or install imageio-ffmpeg."
        ) from exc

    ffmpeg_exe = Path(imageio_ffmpeg.get_ffmpeg_exe()).resolve()
    shim_dir = Path(tempfile.gettempdir()) / "auto_post_ffmpeg"
    shim_dir.mkdir(parents=True, exist_ok=True)

    if os.name == "nt":
        shim_path = shim_dir / "ffmpeg.cmd"
        shim_path.write_text(f'@echo off\r\n"{ffmpeg_exe}" %*\r\n', encoding="utf-8")
    else:
        shim_path = shim_dir / "ffmpeg"
        shim_path.write_text(f'#!/bin/sh\nexec "{ffmpeg_exe}" "$@"\n', encoding="utf-8")
        shim_path.chmod(shim_path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

    path_entries = os.environ.get("PATH", "").split(os.pathsep)
    if str(shim_dir) not in path_entries:
        os.environ["PATH"] = str(shim_dir) + os.pathsep + os.environ.get("PATH", "")

    return str(ffmpeg_exe)

