"""
VoxCPM2-Khmer — Standalone Windows Desktop Application
Bundles FastAPI GPU engine service and a modern webview UI into a single executable.
"""

import sys
import os
import time
import threading
import urllib.request
import traceback

# Ensure paths work when packaged with PyInstaller
if getattr(sys, 'frozen', False):
    APP_ROOT = sys._MEIPASS
else:
    APP_ROOT = os.path.dirname(os.path.abspath(__file__))

# Add app directory to path so imports resolve correctly
sys.path.insert(0, os.path.join(APP_ROOT, "app"))
os.chdir(APP_ROOT)

def log_error(msg):
    log_path = os.path.expanduser("~/voxcpm_error.log")
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")

try:
    import uvicorn
    from app.main import app as fastapi_app
except Exception as e:
    log_error(f"Import error: {traceback.format_exc()}")
    sys.exit(1)


def start_server():
    """Starts FastAPI uvicorn server in background thread."""
    try:
        log_error("Starting uvicorn server...")
        uvicorn.run(fastapi_app, host="127.0.0.1", port=8765, log_level="warning")
    except Exception as e:
        log_error(f"Uvicorn error: {traceback.format_exc()}")


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
    log_error("Starting main process...")
    # 1. Start Server Thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # 2. Wait until server is ACTUALLY ready
    log_error("[VoxCPM2] Waiting for local engine...")
    if wait_for_server(timeout=15):
        log_error("[VoxCPM2] ✓ Server is ready on http://127.0.0.1:8765")
    else:
        log_error("[VoxCPM2] ! Server failed to start within 15 seconds.")
        # Do not open webview if server failed
        sys.exit(1)

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
        log_error(f"Webview error: {traceback.format_exc()}")
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
    try:
        main()
    except Exception as e:
        log_error(f"Main loop error: {traceback.format_exc()}")
