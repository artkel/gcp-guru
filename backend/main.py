from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import questions, progress
import os
from dotenv import load_dotenv

# Load environment variables from parent directory
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

app = FastAPI(
    title="GCP Guru API",
    description="Flashcard learning application for GCP Professional Cloud Architect certification",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router, prefix="/api", tags=["questions"])
app.include_router(progress.router, prefix="/api", tags=["progress"])

@app.get("/")
async def root():
    return {"message": "GCP Guru API - Ready to help you master GCP!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}