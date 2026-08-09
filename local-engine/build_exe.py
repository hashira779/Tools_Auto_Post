"""
PyInstaller Build Script — Compiles VoxCPM2-Khmer Local Engine into a single .exe
"""

import os
import sys
import subprocess

def build():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    print("====================================================")
    print("  🔨 Building VoxCPM2-Khmer-Engine.exe with PyInstaller")
    print(f"  Working Directory: {script_dir}")
    print("====================================================")

    # Install PyInstaller if missing
    try:
        import PyInstaller
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller", "pywebview"], check=True)

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onedir",
        "--windowed",
        "--name=VoxCPM2-Khmer-Engine",
        "--add-data=gui;gui",
        "--add-data=app;app",
        "desktop_app.py"
    ]

    print("Running command:", " ".join(cmd))
    res = subprocess.run(cmd, cwd=script_dir)

    if res.returncode == 0:
        exe_path = os.path.join(script_dir, "dist", "VoxCPM2-Khmer-Engine", "VoxCPM2-Khmer-Engine.exe")
        print("====================================================")
        print(" 🎉 BUILD SUCCESSFUL!")
        print(f" Executable located at: {exe_path}")
        print("====================================================")
    else:
        print("❌ BUILD FAILED with exit code:", res.returncode)

if __name__ == "__main__":
    build()
