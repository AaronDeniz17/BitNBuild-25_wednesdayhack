@echo off
echo Starting GigCampus Development Environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Start backend server
echo Starting backend server...
start "GigCampus Backend" cmd /k "cd /d %~dp0server && npm start"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Start frontend client
echo Starting frontend client...
start "GigCampus Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
