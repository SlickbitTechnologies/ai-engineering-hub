@echo off
echo Starting Cold Chain Monitor application...

:: Kill any processes that might be using our ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /F /PID %%a 2>nul
)

:: Make sure we're in the correct directory
cd /d "%~dp0"

:: Start the backend server in a new window
start "Cold Chain Monitor Backend" cmd /c "python backend/app.py"

:: Wait a moment for the backend to initialize
timeout /t 3

:: Start the frontend server in a new window
start "Cold Chain Monitor Frontend" cmd /c "npm run dev"

echo Both services have been started.
echo.
echo Backend: http://127.0.0.1:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to stop both services...
pause

:: Kill the services when the user presses a key
taskkill /F /FI "WINDOWTITLE eq Cold Chain Monitor Backend*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Cold Chain Monitor Frontend*" 2>nul

echo Services stopped. 