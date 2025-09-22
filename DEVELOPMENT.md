# GCP Guru - Development Guide

## Quick Start

### 🚀 Launch Both Frontend and Backend with One Command

Choose the method that works best for your system:

#### Option 1: NPM Script (Recommended)
```bash
npm run dev
```

#### Option 2: Shell Script (Mac/Linux)
```bash
./dev.sh
```

#### Option 3: Batch File (Windows)
```bat
dev.bat
```

## Available Commands

### Development Commands
```bash
# Start both frontend and backend in development mode
npm run dev

# Start only backend (FastAPI with auto-reload)
npm run backend

# Start only frontend (Next.js with hot reload)
npm run frontend
```

### Production Commands
```bash
# Start both frontend and backend in production mode
npm start

# Start only backend in production mode
npm run backend:prod

# Start only frontend in production mode
npm run frontend:prod
```

### Setup Commands
```bash
# Install all dependencies (both frontend and backend)
npm run install:all

# Install only backend dependencies
npm run install:backend

# Install only frontend dependencies
npm run install:frontend

# Build frontend for production
npm run build

# Run linting and type checking
npm run test
```

## Prerequisites

### 1. Backend Setup
- Python 3.12+ installed
- Virtual environment created in `backend/venv/`
- Backend dependencies installed

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate     # Windows
pip install -r ../requirements.txt
```

### 2. Frontend Setup
- Node.js 18+ installed
- Frontend dependencies installed

```bash
cd frontend
npm install
```

### 3. Environment Configuration
- Create `.env` file in project root with your Google API key:

```env
GOOGLE_API_KEY=your_actual_api_key_here
```

## Development Workflow

### 🔄 Daily Development
1. **Start Development Servers:**
   ```bash
   npm run dev
   ```

2. **Access Applications:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)
   - API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

3. **Stop Servers:**
   - Press `Ctrl+C` in terminal to stop both servers

### 🔧 Making Changes
- **Frontend changes:** Hot reload automatically updates the browser
- **Backend changes:** Auto-reload restarts the FastAPI server
- **Dependency changes:** Restart development servers

### 🧪 Testing
```bash
# Run frontend linting and type checking
npm run test

# Run backend manually
cd backend && source venv/bin/activate && python -m pytest
```

## Troubleshooting

### Common Issues

#### 1. **Port Already in Use**
```
Error: Port 3000/8000 is already in use
```
**Solution:** Kill existing processes or change ports in configuration

#### 2. **Virtual Environment Not Found**
```
❌ Virtual environment not found at backend/venv
```
**Solution:** Create and activate virtual environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
```

#### 3. **Dependencies Missing**
```
❌ Frontend dependencies not found
```
**Solution:** Install frontend dependencies:
```bash
cd frontend && npm install
```

#### 4. **API Key Missing**
```
⚠️ Warning: .env file not found
```
**Solution:** Create `.env` file with your Google API key

#### 5. **Backend Connection Error in Frontend**
```
Network error / API request failed
```
**Solution:** Ensure backend is running on http://localhost:8000

### Debug Mode

To run with additional debugging:

```bash
# Backend with debug logging
cd backend && source venv/bin/activate && uvicorn main:app --reload --log-level debug

# Frontend with debug mode
cd frontend && npm run dev -- --debug
```

## Production Deployment

### Build for Production
```bash
# Build frontend
npm run build

# Start production servers
npm start
```

### Environment Variables
- Ensure `.env` file exists with production API keys
- Update API URLs if deploying to different domains

## Project Structure

```
gcp-guru/
├── backend/                 # FastAPI backend
│   ├── venv/               # Python virtual environment
│   ├── main.py             # FastAPI app entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── src/                # Source code
│   ├── package.json        # Node.js dependencies
│   └── next.config.js      # Next.js configuration
├── frontend_old/           # Original frontend (backup)
├── .env                    # Environment variables
├── package.json            # Root package.json with scripts
├── dev.sh                  # Development script (Mac/Linux)
├── dev.bat                 # Development script (Windows)
└── README.md               # Project documentation
```

## Performance Tips

1. **Use SSD storage** for faster `node_modules` operations
2. **Close unnecessary applications** when running development servers
3. **Use `npm run frontend`** only if you don't need backend API
4. **Use `npm run backend`** only if you're working on API endpoints
5. **Restart servers** after major dependency changes

---

**Happy coding! 🚀** Your GCP Guru development environment is ready for efficient full-stack development.