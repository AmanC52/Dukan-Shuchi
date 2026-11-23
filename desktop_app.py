import sys
import os
import time
import socket
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
from backend.config import APP_TITLE

DEFAULT_PORT = 8000
BIND_IP = "0.0.0.0"
CLIENT_HOST = "127.0.0.1"

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((CLIENT_HOST, port)) == 0

def find_available_port(start_port=8000, max_tries=20):
    for p in range(start_port, start_port + max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((BIND_IP, p))
                return p
            except OSError:
                continue
    return start_port

def is_dukan_server_running(url):
    try:
        with urllib.request.urlopen(f"{url}/api/products", timeout=0.8) as res:
            return res.status == 200
    except Exception:
        return False

def start_server(port):
    uvicorn.run(app, host=BIND_IP, port=port, log_level="error")

def wait_for_server(url, max_attempts=40):
    for _ in range(max_attempts):
        if is_dukan_server_running(url):
            return True
        time.sleep(0.15)
    return False

def main():
    target_port = DEFAULT_PORT
    client_url = f"http://{CLIENT_HOST}:{target_port}"
    
    # Check if a Dukan Sahayak server is ALREADY running on port 8000
    if is_dukan_server_running(client_url):
        print(f"Using already active server on {client_url}")
    else:
        # If port 8000 is occupied by something else, find an available port
        if is_port_in_use(target_port):
            target_port = find_available_port(start_port=8001)
            client_url = f"http://{CLIENT_HOST}:{target_port}"
            
        # Start server in background thread
        server_thread = threading.Thread(target=start_server, args=(target_port,), daemon=True)
        server_thread.start()
        
        # Wait until server is fully responding
        wait_for_server(client_url)

    # Launch desktop application window
    icon_path = os.path.abspath("assets/app_icon.ico")
    if not os.path.exists(icon_path):
        icon_path = None

    window_opened = False

    # 1. Try Pywebview native window
    try:
        window = webview.create_window(
            title=APP_TITLE,
            url=client_url,
            width=1280,
            height=850,
            min_size=(850, 600),
            text_select=True,
            confirm_close=False
        )
        webview.start(gui='edgechromium', debug=False)
        window_opened = True
    except Exception as err:
        with open("desktop_error.log", "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Pywebview fallback triggered: {err}\n")

    # 2. Fallback to Microsoft Edge / Google Chrome Native App Mode
    if not window_opened:
        browser_candidates = [
            os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        ]
        browser_path = None
        for b in browser_candidates:
            if os.path.exists(b):
                browser_path = b
                break

        if browser_path:
            cmd = [browser_path, f"--app={client_url}", "--window-size=1280,850"]
            proc = subprocess.Popen(cmd)
            proc.wait()
        else:
            webbrowser.open(client_url)
            while True:
                time.sleep(1)

if __name__ == '__main__':
    main()
