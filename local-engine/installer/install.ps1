<#
.SYNOPSIS
Installs the CamTech VoxCPM2-Khmer Local GPU Engine on Windows.
#>

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  CamTech VoxCPM2-Khmer Offline Installer" -ForegroundColor Cyan
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
# Use the local requirements.txt if running from source, otherwise copy it over
$ReqFile = "..\requirements.txt"
if (Test-Path $ReqFile) {
    & "$VenvDir\Scripts\pip.exe" install -r $ReqFile --quiet
} else {
    Write-Host "  ! requirements.txt not found, skipping." -ForegroundColor Yellow
}

# 4. Copy App Files
Write-Host "`n[4/5] Copying Application Files..."
$EngineDir = "$AppDir\engine"
if (-not (Test-Path $EngineDir)) {
    New-Item -ItemType Directory -Force -Path $EngineDir | Out-Null
}
Copy-Item -Path "..\app\*" -Destination $EngineDir -Recurse -Force

# 5. Create Silent Startup Script
Write-Host "`n[5/5] Configuring Windows Service..."
$RunScript = "$AppDir\run_hidden.vbs"
$VbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "$VenvDir\Scripts\pythonw.exe" & chr(34) & " -m uvicorn main:app --host 127.0.0.1 --port 8765", 0
Set WshShell = Nothing
"@
Set-Content -Path $RunScript -Value $VbsContent

# Add to Windows Startup
$StartupFolder = [Environment]::GetFolderPath('Startup')
$ShortcutPath = "$StartupFolder\CamTech_VoxCPM2.lnk"
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$RunScript`""
$Shortcut.WorkingDirectory = $EngineDir
$Shortcut.IconLocation = "$VenvDir\Scripts\pythonw.exe, 0"
$Shortcut.Save()

Write-Host "  ✓ Added to Windows Startup." -ForegroundColor Green

# Start it immediately for the first time
Write-Host "`nStarting Local Engine..."
Start-Process "wscript.exe" -ArgumentList "`"$RunScript`"" -WorkingDirectory $EngineDir

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "  ✓ Installation Complete!" -ForegroundColor Green
Write-Host "  Your computer is now ready to generate Khmer voices locally."
Write-Host "  You can open https://camtech.cam and use the website normally."
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Pause
