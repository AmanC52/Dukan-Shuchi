import sys
import os
import time
import threading
import uvicorn
import webview

# Ensure correct base path when running as PyInstaller bundle
if getattr(sys, 'frozen', False):
    os.chdir(os.path.dirname(sys.executable))

from main import app
from backend.config import HOST, PORT, APP_TITLE

def start_api():
    uvicorn.run(app, host=HOST, port=PORT, log_level="error")

def main():
    # Start server in background thread
    server_thread = threading.Thread(target=start_api, daemon=True)
    server_thread.start()
    
    # Wait briefly for server to bind
    time.sleep(1.2)
    
    # Create native desktop window
    window = webview.create_window(
        title=APP_TITLE,
        url=f"http://{HOST}:{PORT}",
        width=1280,
        height=850,
        min_size=(850, 600),
        text_select=True
    )
    webview.start()

if __name__ == '__main__':
    main()
