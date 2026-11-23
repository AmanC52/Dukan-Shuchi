import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

BACKUP_DIR = DATA_DIR / "backups"
BACKUP_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "dukan_data.db"
FRONTEND_DIR = BASE_DIR / "frontend"

# Server Settings
HOST = "127.0.0.1"
PORT = 8000
APP_TITLE = "दुकान सहायक - Smart Dukan Purchasing & Inventory Manager"
APP_VERSION = "2.0.0"
DEBUG = True
