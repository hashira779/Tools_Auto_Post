"""
VoxCPM2-Khmer — Standalone Windows Desktop Application
Bundles FastAPI GPU engine service and a modern webview UI into a single executable.
"""

import sys
import os
import time
import threading
import urllib.request

# Ensure paths work when packaged with PyInstaller
if getattr(sys, 'frozen', False):
    APP_ROOT = sys._MEIPASS
else:
    APP_ROOT = os.path.dirname(os.path.abspath(__file__))

# Add app directory to path so imports resolve correctly
sys.path.insert(0, os.path.join(APP_ROOT, "app"))
os.chdir(APP_ROOT)

import uvicorn
from app.main import app as fastapi_app


def start_server():
    """Starts FastAPI uvicorn server in background thread."""
    uvicorn.run(fastapi_app, host="127.0.0.1", port=8765, log_level="warning")


def wait_for_server(timeout=15):
    """Polls the server until it's actually accepting connections."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request("http://127.0.0.1:8765/health")
            resp = urllib.request.urlopen(req, timeout=1)
            if resp.getcode() == 200:
                return True
        except Exception:
            pass
        time.sleep(0.3)
    return False


def main():
    # 1. Start Server Thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # 2. Wait until server is ACTUALLY ready (not just a fixed 1-second sleep)
    print("[VoxCPM2] Starting local engine...")
    if wait_for_server(timeout=15):
        print("[VoxCPM2] ✓ Server is ready on http://127.0.0.1:8765")
    else:
        print("[VoxCPM2] ! Server may still be starting...")

    # 3. Try pywebview for native modern UI window
    try:
        import webview
        window = webview.create_window(
            title="VoxCPM2-Khmer — Local GPU Engine",
            url="http://127.0.0.1:8765/app",
            width=820,
            height=560,
            resizable=True,
            confirm_close=False,
            background_color="#08090d"
        )
        webview.start()
    except Exception as e:
        # Fallback to default browser
        import webbrowser
        webbrowser.open("http://127.0.0.1:8765/app")
        # Keep process alive
        try:
            while True:
                time.sleep(1.0)
        except KeyboardInterrupt:
            sys.exit(0)


if __name__ == "__main__":
    main()
