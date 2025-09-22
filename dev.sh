#!/bin/bash

# GCP Guru Development Server Launcher
# This script starts both backend and frontend servers concurrently

echo "🚀 Starting GCP Guru Development Environment..."
echo "=================================="

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "❌ Virtual environment not found at backend/venv"
    echo "Please run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r ../requirements.txt"
    exit 1
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Frontend dependencies not found"
    echo "Please run: cd frontend && npm install"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Please create .env file with GOOGLE_API_KEY"
fi

echo "✅ Starting Backend (FastAPI) on http://localhost:8000"
echo "✅ Starting Frontend (Next.js) on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "=================================="

# Start both services using npm run dev which uses concurrently
npm run dev