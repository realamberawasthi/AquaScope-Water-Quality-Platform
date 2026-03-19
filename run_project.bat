@echo off
echo ========================================================
echo Water Quality & Public Health Risk Assessment Platform
echo Installation
echo ========================================================

echo.
echo [1/5] Installing Backend Dependencies...
cd backend
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Error installing backend dependencies. Exiting...
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/5] Initializing Database...
python init_db.py
if %ERRORLEVEL% NEQ 0 (
    echo Error initializing database. Exiting...
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/5] Seeding Initial Data...
python seed_data.py
if %ERRORLEVEL% NEQ 0 (
    echo Error seeding data. Exiting...
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [4/5] Starting Backend Server...
start "WaterQuality_Backend" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [5/5] Installing Frontend Dependencies & Starting...
cd ..\frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing frontend dependencies. Exiting...
    pause
    exit /b %ERRORLEVEL%
)

start "WaterQuality_Frontend" cmd /k "npm run dev"

echo.
echo ========================================================
echo Platform is launching!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Credentials:
echo Admin: admin / admin123
echo Agency: agency / agency123
echo ========================================================
pause
