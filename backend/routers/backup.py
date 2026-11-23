import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.database import create_backup
from backend.config import DB_PATH, BACKUP_DIR

router = APIRouter(tags=["Backup & Maintenance"])

@router.post("/backup")
def trigger_backup():
    backup_path = create_backup()
    if not backup_path:
        raise HTTPException(status_code=500, detail="Database backup failed")
    filename = os.path.basename(backup_path)
    return {"message": "Backup created successfully", "backup_file": filename}

@router.get("/backup/download")
def download_database():
    if not DB_PATH.exists():
        raise HTTPException(status_code=404, detail="Database file not found")
    return FileResponse(
        path=str(DB_PATH),
        filename="dukan_data_backup.db",
        media_type="application/octet-stream"
    )
