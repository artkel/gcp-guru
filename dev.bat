@echo off

REM GCP Guru Development Server Launcher for Windows
REM This script starts both backend and frontend servers concurrently

echo 🚀 Starting GCP Guru Development Environment...
echo ==================================

REM Check if virtual environment exists
if not exist "backend\venv" (
    echo ❌ Virtual environment not found at backend\venv
    echo Please run: cd backend && python -m venv venv && venv\Scripts\activate && pip install -r ..\requirements.txt
    pause
    exit /b 1
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo ❌ Frontend dependencies not found
    echo Please run: cd frontend && npm install
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️ Warning: .env file not found
    echo Please create .env file with GOOGLE_API_KEY
)

echo ✅ Starting Backend (FastAPI) on http://localhost:8000
echo ✅ Starting Frontend (Next.js) on http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo ==================================

REM Start both services using npm run dev which uses concurrently
npm run dev