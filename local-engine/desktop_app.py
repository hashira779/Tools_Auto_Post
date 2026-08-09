"""
VoxCPM2-Khmer — Standalone Windows Desktop Application
Bundles FastAPI GPU engine service and a modern webview UI into a single executable.
"""

import sys
import os
import io
import time
import threading
import traceback

# ── CRITICAL: Fix stdout/stderr for PyInstaller --windowed mode ──
# In windowed mode, sys.stdout and sys.stderr are None.
# Any print() or logging.StreamHandler() call will crash instantly.
if sys.stdout is None:
    sys.stdout = io.StringIO()
if sys.stderr is None:
    sys.stderr = io.StringIO()

# Ensure paths work when packaged with PyInstaller
if getattr(sys, 'frozen', False):
    APP_ROOT = sys._MEIPASS
else:
    APP_ROOT = os.path.dirname(os.path.abspath(__file__))

# Add app directory to path so imports resolve correctly
sys.path.insert(0, os.path.join(APP_ROOT, "app"))
os.chdir(APP_ROOT)

# Error logging to a file since we have no console
_LOG_PATH = os.path.join(os.environ.get("TEMP", os.path.expanduser("~")), "voxcpm2_engine.log")

def log_msg(msg):
    try:
        with open(_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
    except Exception:
        pass

log_msg("Desktop app starting...")

try:
    import uvicorn
    from app.main import app as fastapi_app
    log_msg("Imports successful.")
except Exception as e:
    log_msg(f"Import error: {traceback.format_exc()}")
    sys.exit(1)


def start_server():
    """Starts FastAPI uvicorn server in background thread."""
    try:
        log_msg("Starting uvicorn on 127.0.0.1:8765...")
        uvicorn.run(fastapi_app, host="127.0.0.1", port=8765, log_level="warning")
    except Exception as e:
        log_msg(f"Uvicorn error: {traceback.format_exc()}")


def wait_for_server(timeout=20):
    """Polls the server until it's actually accepting connections."""
    import urllib.request
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request("http://127.0.0.1:8765/health")
            resp = urllib.request.urlopen(req, timeout=1)
            if resp.getcode() == 200:
                return True
        except Exception:
            pass
        time.sleep(0.5)
    return False


def main():
    log_msg("Starting main process...")

    # 1. Start Server Thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # 2. Try pywebview for native modern UI window with a loading screen
    try:
        import webview
        log_msg("Opening pywebview window...")
        
        loading_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>VoxCPM2-Khmer — Starting</title>
            <style>
                body { background: #08090d; color: #e2e8f0; font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column; }
                .spinner { border: 4px solid rgba(255,255,255,0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        </head>
        <body>
            <div class="spinner"></div>
            <h2>Starting Local GPU Engine...</h2>
            <p style="color: #94a3b8">This may take a few seconds.</p>
        </body>
        </html>
        """
        
        window = webview.create_window(
            title="VoxCPM2-Khmer — Local GPU Engine",
            html=loading_html,
            width=820,
            height=560,
            resizable=True,
            confirm_close=False,
            background_color="#08090d"
        )
        
        def check_server():
            if wait_for_server(timeout=30):
                log_msg("Server is ready on http://127.0.0.1:8765, loading app...")
                window.load_url("http://127.0.0.1:8765/app")
            else:
                log_msg("Server failed to start within 30 seconds.")
                window.load_html("<h2>Error: Server failed to start. Check logs.</h2>")

        # Start the checker thread
        threading.Thread(target=check_server, daemon=True).start()
        
        webview.start()
    except Exception as e:
        log_msg(f"Webview error: {traceback.format_exc()}")
        # Fallback to default browser
        if wait_for_server(timeout=30):
            import webbrowser
            webbrowser.open("http://127.0.0.1:8765/app")
            try:
                while True:
                    time.sleep(1.0)
            except KeyboardInterrupt:
                sys.exit(0)
        else:
            log_msg("Server failed to start within 30 seconds. Exiting.")
            sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log_msg(f"Fatal error: {traceback.format_exc()}")
