from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional, List
from models.progress import UserProgress
from services.progress_service import progress_service
from services.question_service import question_service

class ResetOptions(BaseModel):
    scores: bool = True
    sessionHistory: bool = True
    stars: bool = True
    notes: bool = True
    trainingTime: bool = True

router = APIRouter()

@router.get("/progress", response_model=UserProgress)
async def get_progress():
    """Get user progress and analytics"""
    return progress_service.get_user_progress()

@router.get("/progress/session")
async def get_session_summary():
    """Get current session summary"""
    return progress_service.get_session_summary()

@router.get("/progress/status")
async def get_progress_status(tags: Optional[List[str]] = Query(None)):
    """Check if all questions for the given tags are already mastered."""
    all_mastered = progress_service.are_all_questions_mastered_for_tags(tags)
    return {"all_mastered": all_mastered}

@router.post("/progress/session/start")
async def start_new_session():
    """Start a new learning session"""
    progress_service.start_new_session()
    return {"success": True, "message": "New session started"}

@router.post("/progress/reset")
async def reset_progress(options: Optional[ResetOptions] = None):
    """Reset selected progress data"""
    if options is None:
        # Default behavior: reset everything for backward compatibility
        options = ResetOptions()

    progress_service.reset_selective_progress(options.model_dump())
    return {"success": True, "message": "Selected progress has been reset"}

@router.post("/progress/clear-explanations")
async def clear_explanations():
    """Clear all explanations from all questions"""
    success = question_service.clear_all_explanations()
    if success:
        return {"success": True, "message": "All explanations have been cleared"}
    else:
        return {"success": False, "message": "Failed to clear explanations"}

@router.post("/progress/clear-hints")
async def clear_hints():
    """Clear all hints from all questions"""
    success = question_service.clear_all_hints()
    if success:
        return {"success": True, "message": "All hints have been cleared"}
    else:
        return {"success": False, "message": "Failed to clear hints"}