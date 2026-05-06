@echo off
chcp 65001 >nul
title Al-Khwarizmi Attendance System

echo ==========================================
echo   نظام حضور وانصراف الخوارزمي
echo   Starting Desktop Application...
echo ==========================================
echo.

REM Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Install Electron dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start Electron
echo Launching application...
call npm start

pause