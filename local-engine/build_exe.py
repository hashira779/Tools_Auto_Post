"""
PyInstaller Build Script — Compiles VoxCPM2-Khmer Local Engine into a standalone single-file .exe
"""

import os
import sys
import shutil
import subprocess

def build():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    print("====================================================")
    print("  🔨 Building Standalone VoxCPM2-Khmer-Engine.exe (--onefile)")
    print(f"  Working Directory: {script_dir}")
    print("====================================================")

    # Ensure PyInstaller is available
    try:
        import PyInstaller
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller", "pywebview"], check=True)

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--name=VoxCPM2-Khmer-Engine",
        "--add-data=gui;gui",
        "--add-data=app;app",
        "--hidden-import=torch",
        "--hidden-import=transformers",
        "--hidden-import=scipy",
        "desktop_app.py"
    ]

    print("Running PyInstaller command:", " ".join(cmd))
    res = subprocess.run(cmd, cwd=script_dir)

    if res.returncode == 0:
        dist_exe = os.path.join(script_dir, "dist", "VoxCPM2-Khmer-Engine.exe")
        public_dir = os.path.join(script_dir, "..", "services", "savemedia-web", "frontend", "public")
        public_exe = os.path.join(public_dir, "VoxCPM2-Khmer-Engine.exe")

        os.makedirs(public_dir, exist_ok=True)
        if os.path.exists(dist_exe):
            shutil.copy2(dist_exe, public_exe)
            print(f"  ✓ Copied executable to frontend public directory: {public_exe}")

        print("====================================================")
        print(" 🎉 BUILD SUCCESSFUL!")
        print(f" Single-file Executable: {dist_exe}")
        print("====================================================")
    else:
        print("❌ BUILD FAILED with exit code:", res.returncode)

if __name__ == "__main__":
    build()
