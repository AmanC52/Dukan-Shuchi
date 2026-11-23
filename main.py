import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.config import APP_TITLE, APP_VERSION, HOST, PORT, FRONTEND_DIR
from backend.database import init_database, create_backup
from backend.routers import products_router, trips_router, analytics_router, backup_router

# 1. Initialize Database & create safe startup backup
init_database()
create_backup()

# 2. FastAPI Application
app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description="Dukandar Smart Purchasing, Inventory & Margin Management System"
)

# 3. Enable CORS for Mobile App and Local Network Access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Register API Routers
app.include_router(products_router, prefix="/api")
app.include_router(trips_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(backup_router, prefix="/api")

# 5. Frontend Static Files & SPA Route
@app.get("/")
def serve_index():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "Frontend not found"}

# Mount frontend assets
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

if __name__ == "__main__":
    print(f"========================================================")
    print(f" {APP_TITLE} (v{APP_VERSION})")
    print(f" Running at: http://{HOST}:{PORT}")
    print(f"========================================================")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
