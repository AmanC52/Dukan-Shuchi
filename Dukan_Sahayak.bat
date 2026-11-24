@echo off
chcp 65001 >nul
title Dukan Sahayak - Smart Purchasing Manager
cd /d "%~dp0"

echo ========================================================
echo        Dukan Sahayak (v2.0) - Launching...
echo ========================================================
echo.

if exist "%~dp0dist\DukanSahayak\DukanSahayak.exe" (
    echo Launching Desktop Application...
    start "" "%~dp0dist\DukanSahayak\DukanSahayak.exe"
    exit /b 0
) else if exist "%~dp0desktop_app.py" (
    echo Starting with Python desktop wrapper...
    python "%~dp0desktop_app.py"
    if errorlevel 1 goto :error
) else (
    echo Starting server and opening browser...
    start "" "http://127.0.0.1:8000"
    python "%~dp0main.py"
    if errorlevel 1 goto :error
)
exit /b 0

:error
echo.
echo [ERROR] Application encountered an error during launch.
pause
