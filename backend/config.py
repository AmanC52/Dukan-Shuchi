import sys
import os
import shutil
from pathlib import Path

# Base Paths & Frozen Bundle Detection
if getattr(sys, 'frozen', False):
    # PyInstaller Bundle Mode
    EXE_DIR = Path(sys.executable).resolve().parent
    BASE_DIR = EXE_DIR
    INTERNAL_DIR = Path(getattr(sys, '_MEIPASS', EXE_DIR / "_internal"))

    # User Data Directory (Directly next to DukanSahayak.exe for persistence and easy backup)
    DATA_DIR = BASE_DIR / "data"
    DATA_DIR.mkdir(exist_ok=True)

    BACKUP_DIR = DATA_DIR / "backups"
    BACKUP_DIR.mkdir(exist_ok=True)

    DB_PATH = DATA_DIR / "dukan_data.db"
    
    # If DB does not exist next to exe, copy template from _internal
    if not DB_PATH.exists():
        internal_db = INTERNAL_DIR / "data" / "dukan_data.db"
        if internal_db.exists():
            try:
                shutil.copy2(str(internal_db), str(DB_PATH))
            except Exception as e:
                print(f"Error copying seed database: {e}")

    # Frontend Directory
    if (INTERNAL_DIR / "frontend").exists():
        FRONTEND_DIR = INTERNAL_DIR / "frontend"
    else:
        FRONTEND_DIR = BASE_DIR / "frontend"
else:
    # Standard Python Development Mode
    BASE_DIR = Path(__file__).resolve().parent.parent
    DATA_DIR = BASE_DIR / "data"
    DATA_DIR.mkdir(exist_ok=True)

    BACKUP_DIR = DATA_DIR / "backups"
    BACKUP_DIR.mkdir(exist_ok=True)

    DB_PATH = DATA_DIR / "dukan_data.db"
    FRONTEND_DIR = BASE_DIR / "frontend"

# Server Settings
# Listen on 0.0.0.0 so both PC localhost and local Wi-Fi mobile devices can connect
HOST = "0.0.0.0"
PORT = 8000
APP_TITLE = "दुकान सहायक - Smart Dukan Purchasing & Inventory Manager"
APP_VERSION = "2.0.0"
DEBUG = False
