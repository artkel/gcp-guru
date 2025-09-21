from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, date

class SessionStats(BaseModel):
    total_questions: int = 0
    correct_answers: int = 0
    incorrect_answers: int = 0
    accuracy: float = 0.0
    session_start: datetime
    session_end: Optional[datetime] = None

class TagProgress(BaseModel):
    tag: str
    total_questions: int
    mistakes_count: int  # score -1
    learning_count: int  # score 0-1
    mastered_count: int  # score 2-3
    perfected_count: int  # score 4+
    mastery_percentage: float  # ((mastered + perfected) / total) * 100

class DailySessionHistory(BaseModel):
    date: date
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    accuracy: float
    duration_minutes: float = 0.0
    tags: List[str] = []

class OverallProgress(BaseModel):
    total_questions: int
    mistakes_count: int  # score -1
    learning_count: int  # score 0-1
    mastered_count: int  # score 2-3
    perfected_count: int  # score 4+
    starred_questions: int
    questions_with_notes: int
    total_training_time_minutes: float
    tag_progress: List[TagProgress]

class UserProgress(BaseModel):
    current_session: SessionStats
    last_session: Optional[DailySessionHistory] = None
    overall: OverallProgress
    streak_days: int = 0
    session_history: List[DailySessionHistory] = []