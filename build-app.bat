@echo off
chcp 65001 >nul
title Building Al-Khwarizmi Desktop App

echo ==========================================
echo   Building Al-Khwarizmi Desktop App
echo ==========================================
echo.

REM Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found
    pause
    exit /b 1
)

echo [1/5] Installing Python dependencies...
pip install pyinstaller -q
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install pyinstaller
    pause
    exit /b 1
)

echo.
echo [2/5] Building Django executable with PyInstaller...
cd ..
pyinstaller run_server.spec --clean --noconfirm
if %errorlevel% neq 0 (
    echo [ERROR] PyInstaller failed
    pause
    exit /b 1
)

echo.
echo [3/5] Copying built files to electron/build...
if not exist "build" mkdir build
xcopy /E /Y /Q "..\dist\run_server\*" "build\"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to copy files
    pause
    exit /b 1
)

echo.
echo [4/5] Installing Node.js dependencies...
cd ..
cd electron
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm packages
    pause
    exit /b 1
)

echo.
echo [5/5] Building Electron app...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Electron build failed
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Build Complete!
echo   Output: electron\dist\
echo ==========================================
pause