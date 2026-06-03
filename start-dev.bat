@echo off
cd /d "%~dp0"

REM One command starts PHP (8787) + Vite — see package.json "dev" script
start "LeoWorks dev" cmd /k "npm run dev"

timeout /t 3 >nul
start "" "http://localhost:5173/"
