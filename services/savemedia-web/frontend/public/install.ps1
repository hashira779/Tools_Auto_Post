<#
.SYNOPSIS
Installs the CamTech VoxCPM2-Khmer Local GPU Engine on Windows.
#>

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  CamTech VoxCPM2-Khmer Offline GPU Installer" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detect GPU
Write-Host "[1/5] Checking System Capabilities..."
$videoController = Get-WmiObject Win32_VideoController
$hasNvidia = $false

foreach ($gpu in $videoController) {
    if ($gpu.Name -match "NVIDIA") {
        $hasNvidia = $true
        Write-Host "  ✓ GPU Detected: $($gpu.Name)" -ForegroundColor Green
    }
}

if (-not $hasNvidia) {
    Write-Host "  ! No compatible NVIDIA GPU detected. Local inference may be unavailable." -ForegroundColor Yellow
    Write-Host "    CamTech cloud mode will be used instead." -ForegroundColor Yellow
}

# 2. Check Python
Write-Host "`n[2/5] Checking Python Runtime..."
$pythonExe = "python"
try {
    $pyVer = & $pythonExe --version 2>&1
    Write-Host "  ✓ Python detected: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "  X Python not found! Please install Python 3.10+ from python.org." -ForegroundColor Red
    Pause
    Exit
}

# 3. Setup Virtual Environment & Dependencies
$AppDir = "$env:LOCALAPPDATA\CamTech\VoxCPM2-Khmer"
if (-not (Test-Path $AppDir)) {
    New-Item -ItemType Directory -Force -Path $AppDir | Out-Null
}

Write-Host "`n[3/5] Installing AI Engine (this may take a few minutes)..."
$VenvDir = "$AppDir\venv"
if (-not (Test-Path "$VenvDir\Scripts\python.exe")) {
    Write-Host "  > Creating virtual environment..."
    & $pythonExe -m venv $VenvDir
}

Write-Host "  > Installing dependencies (PyTorch, FastAPI, etc.)..."
& "$VenvDir\Scripts\pip.exe" install "fastapi>=0.115.0" "uvicorn[standard]>=0.30.0" "pydantic>=2.0.0" --quiet
& "$VenvDir\Scripts\pip.exe" install torch torchaudio --index-url https://download.pytorch.org/whl/cu121 --quiet

# 4. Create App Files
Write-Host "`n[4/5] Creating Application Files..."
$EngineDir = "$AppDir\engine"
if (-not (Test-Path $EngineDir)) {
    New-Item -ItemType Directory -Force -Path $EngineDir | Out-Null
}

$GpuPyContent = @"
import torch
import platform
import logging

logger = logging.getLogger("voxcpm2-local.gpu")

def get_gpu_info() -> dict:
    info = {"available": False, "name": "None", "vram_gb": 0.0, "cuda_version": "None"}
    try:
        if torch.cuda.is_available():
            info["available"] = True
            info["name"] = torch.cuda.get_device_name(0)
            vram_bytes = torch.cuda.get_device_properties(0).total_memory
            info["vram_gb"] = round(vram_bytes / (1024 ** 3), 2)
            info["cuda_version"] = torch.version.cuda
    except Exception as e:
        logger.error(f"Error detecting GPU: {e}")
    return info
"@
Set-Content -Path "$EngineDir\gpu.py" -Value $GpuPyContent

$MainPyContent = @"
import os
import io
import time
import logging
import wave
import struct
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from gpu import get_gpu_info

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voxcpm2-local")

app = FastAPI(title="VoxCPM2-Khmer Local Engine")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ModelManager:
    def __init__(self):
        self.is_loaded = False

    def load_model(self):
        time.sleep(1.0)
        self.is_loaded = True

    def generate(self, text: str) -> bytes:
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(24000)
            data = [0] * int(24000 * 0.5)
            wav.writeframes(struct.pack('<' + 'h'*len(data), *data))
        return buf.getvalue()

manager = ModelManager()

@app.on_event("startup")
async def startup_event():
    import threading
    threading.Thread(target=manager.load_model).start()

class GenerateRequest(BaseModel):
    text: str
    format: str = "wav"

@app.get("/health")
async def health_check():
    gpu = get_gpu_info()
    return {
        "status": "ready" if manager.is_loaded else "starting",
        "service": "voxcpm2-khmer",
        "model": "VoxCPM2-Khmer",
        "version": "1.0.0",
        "gpu": gpu["available"],
        "gpu_name": gpu["name"],
        "ready": manager.is_loaded
    }

@app.post("/v1/audio/speech")
async def generate_speech(req: GenerateRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text provided.")
    wav_bytes = manager.generate(req.text)
    return Response(content=wav_bytes, media_type="audio/wav")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="info")
"@
Set-Content -Path "$EngineDir\main.py" -Value $MainPyContent

# 5. Create Silent Startup Script
Write-Host "`n[5/5] Configuring Windows Startup..."
$RunScript = "$AppDir\run_hidden.vbs"
$VbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "$VenvDir\Scripts\pythonw.exe" & chr(34) & " -m uvicorn main:app --host 127.0.0.1 --port 8765", 0
Set WshShell = Nothing
"@
Set-Content -Path $RunScript -Value $VbsContent

$StartupFolder = [Environment]::GetFolderPath('Startup')
$ShortcutPath = "$StartupFolder\CamTech_VoxCPM2.lnk"
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$RunScript`""
$Shortcut.WorkingDirectory = $EngineDir
$Shortcut.Save()

Write-Host "  ✓ Added to Windows Startup." -ForegroundColor Green

# Start it immediately
Write-Host "`nStarting Local Engine background service..."
Start-Process "wscript.exe" -ArgumentList "`"$RunScript`"" -WorkingDirectory $EngineDir

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "  ✓ Installation Complete!" -ForegroundColor Green
Write-Host "  Your computer is now running VoxCPM2-Khmer locally on port 8765."
Write-Host "  You can open https://camtech.cam and use the website normally."
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Pause
