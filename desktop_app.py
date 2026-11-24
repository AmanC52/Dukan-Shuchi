import sys
import os
import io
import time
import socket
import threading
import uvicorn
import urllib.request
import webbrowser
import subprocess

# 1. Protect stdout and stderr in PyInstaller windowed mode (console=False)
if sys.stdout is None:
    sys.stdout = io.StringIO()
if sys.stderr is None:
    sys.stderr = io.StringIO()

# 2. Ensure correct base path when running as PyInstaller bundle
if getattr(sys, 'frozen', False):
    os.chdir(os.path.dirname(sys.executable))

from main import app
from backend.config import APP_TITLE

DEFAULT_PORT = 8000
BIND_IP = "0.0.0.0"
CLIENT_HOST = "127.0.0.1"

def log_debug(msg):
    try:
        with open("desktop_app.log", "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
    except Exception:
        pass

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
        req = urllib.request.Request(
            f"{url}/api/products",
            headers={"User-Agent": "DukanDesktopHealthCheck"}
        )
        with urllib.request.urlopen(req, timeout=1.0) as res:
            return res.status == 200
    except Exception:
        return False

def start_server(port):
    try:
        config = uvicorn.Config(
            app=app,
            host=BIND_IP,
            port=port,
            log_level="warning",
            access_log=False
        )
        server = uvicorn.Server(config)
        server.run()
    except Exception as err:
        log_debug(f"Server error: {err}")

def wait_for_server(url, max_attempts=50):
    for _ in range(max_attempts):
        if is_dukan_server_running(url):
            return True
        time.sleep(0.12)
    return False

def get_app_icon_path():
    candidates = [
        os.path.abspath("assets/app_icon.ico"),
        os.path.join(os.path.dirname(sys.executable), "assets", "app_icon.ico"),
        os.path.join(os.path.dirname(sys.executable), "_internal", "assets", "app_icon.ico"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def main():
    log_debug("Application started")
    target_port = DEFAULT_PORT
    client_url = f"http://{CLIENT_HOST}:{target_port}"
    
    # Check if a Dukan Sahayak server is ALREADY running on port 8000
    if is_dukan_server_running(client_url):
        log_debug(f"Connecting to existing active server at {client_url}")
    else:
        # If port 8000 is occupied by another software, find an available port
        if is_port_in_use(target_port):
            target_port = find_available_port(start_port=8001)
            client_url = f"http://{CLIENT_HOST}:{target_port}"
            
        log_debug(f"Starting background server on port {target_port}")
        server_thread = threading.Thread(target=start_server, args=(target_port,), daemon=True)
        server_thread.start()
        
        # Wait until server is fully responding
        ready = wait_for_server(client_url)
        log_debug(f"Server ready status: {ready} on {client_url}")

    icon_path = get_app_icon_path()
    window_opened = False

    # 1. Try Pywebview native desktop window
    try:
        import webview
        window = webview.create_window(
            title=APP_TITLE,
            url=client_url,
            width=1280,
            height=850,
            min_size=(850, 600),
            text_select=True,
            confirm_close=False
        )
        try:
            webview.start(gui='edgechromium', debug=False)
            window_opened = True
            log_debug("Pywebview closed normally by user")
        except Exception as e_gui:
            log_debug(f"EdgeChromium gui failed, trying default: {e_gui}")
            webview.start(debug=False)
            window_opened = True
            log_debug("Pywebview (default) closed normally by user")
    except Exception as err:
        log_debug(f"Pywebview native window unavailable: {err}")

    # 2. Fallback to Microsoft Edge / Google Chrome Native App Mode or Default Browser
    if not window_opened:
        browser_candidates = [
            os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
        ]
        browser_path = None
        for b in browser_candidates:
            if os.path.exists(b):
                browser_path = b
                break

        if browser_path:
            log_debug(f"Launching app window via: {browser_path}")
            try:
                cmd = [browser_path, f"--app={client_url}", "--window-size=1280,850"]
                subprocess.Popen(cmd)
            except Exception as e_launch:
                log_debug(f"Browser app launch failed: {e_launch}, opening default browser")
                webbrowser.open(client_url)
        else:
            log_debug("Opening system default browser")
            webbrowser.open(client_url)

        # IMPORTANT: Windows browsers (Edge/Chrome) exit immediately after handing off to
        # existing background processes. We must keep Python server running indefinitely!
        log_debug("Server loop running in background for browser session")
        try:
            while True:
                time.sleep(1)
        except (KeyboardInterrupt, SystemExit):
            log_debug("Exiting on signal")

if __name__ == '__main__':
    main()
