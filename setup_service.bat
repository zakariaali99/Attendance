@echo off
echo ========================================================
echo   Al-Khwarizmi Attendance System - NSSM Service Setup
echo ========================================================
echo.

:: IMPORTANT: Update these paths according to your actual Windows server setup
:: 1. Path to your Python executable (preferably inside your virtual environment)
set PYTHON_PATH=C:\Windows\System32\Attendance\.venv\Scripts\python.exe

:: 2. Path to the Django project directory (where run_server.py is located)
set PROJECT_DIR=C:\Windows\System32\Attendance

:: 3. The name of the service
set SERVICE_NAME=AlKhwarizmiAttendance

:: 4. Port for the server (8000 for NSSM, 8765 for Electron)
set PORT=8000

echo Python Path: %PYTHON_PATH%
echo Project Dir: %PROJECT_DIR%
echo Service Name: %SERVICE_NAME%
echo Port: %PORT%
echo.

:: Check if NSSM is available
where nssm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] nssm.exe is not in your system PATH.
    echo Please download NSSM, extract it, and add it to your PATH, or put nssm.exe in this folder.
    pause
    exit /b 1
)

echo Installing service %SERVICE_NAME%...
nssm install %SERVICE_NAME% "%PYTHON_PATH%" "%PROJECT_DIR%\run_server.py"

echo Setting environment variables...
nssm set %SERVICE_NAME% AppEnvironmentExtra "PORT=8000;DESKTOP_MODE=0"

echo Setting service directory...
nssm set %SERVICE_NAME% AppDirectory "%PROJECT_DIR%"

echo Setting service description...
nssm set %SERVICE_NAME% Description "Al-Khwarizmi Attendance System built with Django and Waitress"

:: Automatically restart the service if it crashes
nssm set %SERVICE_NAME% AppExit Default Restart
nssm set %SERVICE_NAME% AppRestartDelay 5000

echo.
echo Service successfully installed!
echo To start the service now, run: nssm start %SERVICE_NAME%
echo.
pause
