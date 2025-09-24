from pydantic import BaseModel
from typing import Dict, List, Optional

class Answer(BaseModel):
    answer_text: str
    status: str  # "correct" or "incorrect"

class Question(BaseModel):
    question_number: int
    question_text: str
    answers: Dict[str, Answer]
    tag: List[str]
    explanation: str = ""
    hint: str = ""
    score: int = 0
    starred: bool = False
    note: str = ""
    active: bool = True
    case_study: Optional[str] = ""
    placeholder_3: str = ""

class QuestionResponse(BaseModel):
    question: Question
    is_correct: bool
    correct_answers: List[str]
    explanation: Optional[str] = None

class AnswerSubmission(BaseModel):
    selected_answers: List[str]
    request_explanation: bool = False