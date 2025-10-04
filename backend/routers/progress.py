from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel
from typing import Optional, List
from models.progress import UserProgress
from services.progress_service import progress_service
from services.question_service import question_service
from services.auth_service import verify_token

class ResetOptions(BaseModel):
    scores: bool = True
    sessionHistory: bool = True
    stars: bool = True
    notes: bool = True
    trainingTime: bool = True

router = APIRouter()

@router.get("/progress", response_model=UserProgress)
async def get_progress(token: dict = Depends(verify_token)):
    """Get user progress and analytics"""
    return progress_service.get_user_progress()

@router.get("/progress/session")
async def get_session_summary(token: dict = Depends(verify_token)):
    """Get current session summary"""
    return progress_service.get_session_summary()

@router.get("/progress/status")
async def get_progress_status(
    tags: Optional[List[str]] = Query(None),
    token: dict = Depends(verify_token)
):
    """Check if all questions for the given tags are already mastered."""
    all_mastered = progress_service.are_all_questions_mastered_for_tags(tags)
    return {"all_mastered": all_mastered}

@router.get("/progress/available-mastery-levels")
async def get_available_mastery_levels(
    tags: Optional[List[str]] = Query(None),
    token: dict = Depends(verify_token)
):
    """Get which mastery levels have questions available for the given tags."""
    availability = progress_service.get_available_mastery_levels_for_tags(tags)
    return {"mastery_levels": availability}

class SessionStartRequest(BaseModel):
    active_duration_ms: Optional[int] = None  # Active time in milliseconds (excluding paused time)

@router.post("/progress/session/start")
async def start_new_session(
    request: Optional[SessionStartRequest] = None,
    token: dict = Depends(verify_token)
):
    """Start a new learning session"""
    active_duration_minutes = None
    if request and request.active_duration_ms:
        active_duration_minutes = request.active_duration_ms / 60000  # Convert ms to minutes
    progress_service.start_new_session(active_duration_minutes)
    return {"success": True, "message": "New session started"}

@router.post("/progress/reset")
async def reset_progress(
    options: Optional[ResetOptions] = None,
    token: dict = Depends(verify_token)
):
    """Reset selected progress data"""
    if options is None:
        # Default behavior: reset everything for backward compatibility
        options = ResetOptions()

    progress_service.reset_selective_progress(options.model_dump())
    return {"success": True, "message": "Selected progress has been reset"}

@router.post("/progress/clear-explanations")
async def clear_explanations(token: dict = Depends(verify_token)):
    """Clear all explanations from all questions"""
    success = question_service.clear_all_explanations()
    if success:
        return {"success": True, "message": "All explanations have been cleared"}
    else:
        return {"success": False, "message": "Failed to clear explanations"}

@router.post("/progress/clear-hints")
async def clear_hints(token: dict = Depends(verify_token)):
    """Clear all hints from all questions"""
    success = question_service.clear_all_hints()
    if success:
        return {"success": True, "message": "All hints have been cleared"}
    else:
        return {"success": False, "message": "Failed to clear hints"}