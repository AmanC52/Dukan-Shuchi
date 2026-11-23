@echo off
title दुकान सहायक - Dukan Assistant
cd /d "%~dp0"

echo ========================================================
echo        दुकान सहायक (Dukan Assistant Pro v2.0)
echo ========================================================
echo.
echo सॉफ्टवेयर शुरू किया जा रहा है, कृपया प्रतीक्षा करें...
echo.

if exist "dist\DukanSahayak\DukanSahayak.exe" (
    start "" "dist\DukanSahayak\DukanSahayak.exe"
    exit
) else if exist "desktop_app.py" (
    python desktop_app.py
) else (
    start "" "http://127.0.0.1:8000"
    python main.py
)
