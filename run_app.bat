@echo off
title Dukan Assistant - Smart Purchasing & Inventory Tool
echo ========================================================
echo        Dukan Assistant - Dukandar Smart Tool
echo ========================================================
echo.
echo Local server shuru ho raha hai...
echo Kripya thoda intezar karein.
echo.

cd /d "%~dp0"

start "" "http://127.0.0.1:8000"

python main.py

pause
