from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from models.question import Question, AnswerSubmission, QuestionResponse
from services.question_service import question_service
from services.ai_service import get_ai_service
from services.progress_service import progress_service

router = APIRouter()

@router.get("/questions", response_model=List[Question])
async def get_questions(
    tags: Optional[List[str]] = Query(None),
    search: Optional[str] = Query(None),
    starred_only: bool = Query(False)
):
    """Get questions with optional filtering (only active questions)"""
    questions = question_service.get_all_questions()

    # Filter out inactive questions first
    questions = [q for q in questions if q.active]

    # Apply filters
    if tags:
        questions = [q for q in questions if any(tag in q.tag for tag in tags)]

    if search:
        # For search, we need to filter search results to only active questions
        search_results = question_service.search_questions(search)
        questions = [q for q in search_results if q.active]

    if starred_only:
        questions = [q for q in questions if q.starred]

    return questions

@router.get("/questions/random", response_model=Question)
async def get_random_question(tags: Optional[List[str]] = Query(None)):
    """Get a random question, optionally filtered by tags"""
    question = question_service.get_random_question(tags)
    if not question:
        # Check why no question was returned
        from services.progress_service import progress_service
        available = progress_service.get_available_questions_for_tags(tags)

        if len(available) == 0:
            # Check if all questions for these tags are mastered
            if progress_service.are_all_questions_mastered_for_tags(tags):
                raise HTTPException(status_code=410, detail="All questions with related tag(s) are mastered")
            else:
                # Session complete - all available questions shown in this session
                raise HTTPException(status_code=410, detail="Session complete: No more questions available")
        else:
            raise HTTPException(status_code=404, detail="No questions found")
    return question

@router.get("/questions/{question_id}", response_model=Question)
async def get_question(question_id: int):
    """Get a specific question by ID"""
    question = question_service.get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@router.post("/questions/{question_id}/answer", response_model=QuestionResponse)
async def submit_answer(question_id: int, submission: AnswerSubmission):
    """Submit an answer and get feedback"""
    question = question_service.get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Check the answer
    result = question_service.check_answer(question_id, submission.selected_answers)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # Record the answer in progress tracking
    progress_service.record_answer(result["is_correct"])

    # Get explanation if requested
    explanation = None
    if submission.request_explanation:
        explanation = get_ai_service().generate_explanation(
            question, submission.selected_answers, result["correct_answers"]
        )

    # Get updated question with new score
    updated_question = question_service.get_question_by_id(question_id)

    return QuestionResponse(
        question=updated_question,
        is_correct=result["is_correct"],
        correct_answers=result["correct_answers"],
        explanation=explanation
    )

@router.get("/questions/{question_id}/hint")
async def get_hint(question_id: int):
    """Get a hint for a specific question"""
    question = question_service.get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    hint = get_ai_service().generate_hint(question)
    return {"hint": hint}

@router.get("/questions/{question_id}/explanation")
async def get_explanation(question_id: int, regenerate: bool = Query(False)):
    """Get explanation for a specific question"""
    question = question_service.get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # For getting explanation without answering, we need the correct answers
    correct_answers = [key for key, answer in question.answers.items() if answer.status == "correct"]

    explanation = get_ai_service().generate_explanation(question, [], correct_answers, force_regenerate=regenerate)
    return {"explanation": explanation}

@router.post("/questions/{question_id}/star")
async def toggle_star(question_id: int, starred: bool = Query(...)):
    """Toggle star status for a question"""
    success = question_service.update_question_star(question_id, starred)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"success": True, "starred": starred}

@router.post("/questions/{question_id}/note")
async def update_note(question_id: int, note: str = Query(...)):
    """Add or update a note for a question"""
    success = question_service.update_question_note(question_id, note)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"success": True, "note": note}

@router.get("/tags")
async def get_available_tags():
    """Get all available question tags (only from active questions)"""
    questions = question_service.get_all_questions()
    tags = set()
    for question in questions:
        if question.active:  # Only include tags from active questions
            tags.update(question.tag)
    return {"tags": sorted(list(tags))}