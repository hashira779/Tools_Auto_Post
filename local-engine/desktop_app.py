"""
VoxCPM2-Khmer — Standalone Windows Desktop Application
Bundles FastAPI GPU engine service and a modern webview UI into a single executable.
"""

import sys
import os
import time
import threading
import uvicorn

# Ensure paths work when packaged with PyInstaller
if getattr(sys, 'frozen', False):
    APP_ROOT = sys._MEIPASS
else:
    APP_ROOT = os.path.dirname(os.path.abspath(__file__))

sys.path.insert(0, os.path.join(APP_ROOT, "app"))

from app.main import app as fastapi_app

def start_server():
    """Starts FastAPI uvicorn server in background thread."""
    uvicorn.run(fastapi_app, host="127.0.0.1", port=8765, log_level="error")

def main():
    # 1. Start Server Thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait for server to bind
    time.sleep(1.0)

    # 2. Try pywebview for native modern UI window
    try:
        import webview
        window = webview.create_window(
            title="VoxCPM2-Khmer — Local GPU Engine",
            url="http://127.0.0.1:8765/app",
            width=780,
            height=540,
            resizable=False,
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
