import sys
import os
import time
import threading
import uvicorn
import webview
import urllib.request
import webbrowser
import subprocess

# Ensure correct base path when running as PyInstaller bundle
if getattr(sys, 'frozen', False):
    os.chdir(os.path.dirname(sys.executable))

from main import app
from backend.config import HOST, PORT, APP_TITLE

def start_api():
    uvicorn.run(app, host=HOST, port=PORT, log_level="error")

def wait_for_server(url, max_attempts=30):
    for _ in range(max_attempts):
        try:
            with urllib.request.urlopen(url, timeout=0.5) as res:
                if res.status == 200:
                    return True
        except Exception:
            time.sleep(0.2)
    return False

def main():
    # 1. Start FastAPI server in background thread
    server_thread = threading.Thread(target=start_api, daemon=True)
    server_thread.start()
    
    # 2. Wait until server is fully alive and responding
    server_url = f"http://{HOST}:{PORT}"
    wait_for_server(f"{server_url}/api/products")
    
    # 3. Create native desktop window
    try:
        window = webview.create_window(
            title=APP_TITLE,
            url=server_url,
            width=1280,
            height=850,
            min_size=(850, 600),
            text_select=True,
            confirm_close=False
        )
        webview.start(gui='edgechromium', debug=False)
    except Exception as e:
        # Fallback to Edge native app mode or system browser
        edge_paths = [
            os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        ]
        launched = False
        for p in edge_paths:
            if os.path.exists(p):
                subprocess.Popen([p, f"--app={server_url}", "--window-size=1280,850"])
                launched = True
                break
        if not launched:
            webbrowser.open(server_url)
            
        while True:
            time.sleep(1)

if __name__ == '__main__':
    main()
