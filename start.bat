@echo off
echo ===================================
echo    تشغيل نظام الكاشير POS
echo ===================================

echo.
echo [1/2] تشغيل الباكند (FastAPI)...
cd /d "%~dp0backend"
start "POS Backend" cmd /k "pip install -r requirements.txt --quiet && python -m uvicorn main:app --reload --port 8000"

timeout /t 4 /nobreak > nul

echo [2/2] تشغيل الفرونتند (React)...
cd /d "%~dp0frontend"
start "POS Frontend" cmd /k "npm install --silent && npm run dev"

timeout /t 5 /nobreak > nul

echo.
echo ✅ يمكنك فتح المتصفح على: http://localhost:5173
echo.
start http://localhost:5173
pause
