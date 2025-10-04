from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from pydantic import BaseModel
from models.question import Question, AnswerSubmission, QuestionResponse, ShuffledQuestion, AnswerSubmissionWithMapping, ShuffledQuestionResponse
from services.question_service import question_service
from services.answer_shuffler import AnswerShuffler
from services.ai_service import get_ai_service
from services.progress_service import progress_service
from services.auth_service import verify_token

router = APIRouter()

@router.get("/questions", response_model=List[Question])
async def get_questions(
    tags: Optional[List[str]] = Query(None),
    search: Optional[str] = Query(None),
    starred_only: bool = Query(False),
    token: dict = Depends(verify_token)
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
async def get_random_question(
    tags: Optional[List[str]] = Query(None),
    mastery_levels: Optional[List[str]] = Query(None),
    token: dict = Depends(verify_token)
):
    """Get a random question, optionally filtered by tags and mastery levels"""
    question = question_service.get_random_question(tags, mastery_levels)
    if not question:
        # Check why no question was returned
        from services.progress_service import progress_service
        available = progress_service.get_available_questions_for_tags(tags, mastery_levels)

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

@router.get("/questions/random-shuffled", response_model=ShuffledQuestion)
async def get_random_shuffled_question(
    tags: Optional[List[str]] = Query(None),
    mastery_levels: Optional[List[str]] = Query(None),
    token: dict = Depends(verify_token)
):
    """Get a random question with shuffled answers"""
    shuffled_question = question_service.get_random_shuffled_question(tags, mastery_levels)
    if not shuffled_question:
        # Check why no question was returned (reuse existing logic)
        from services.progress_service import progress_service
        available = progress_service.get_available_questions_for_tags(tags, mastery_levels)

        if len(available) == 0:
            # Check if all questions for these tags are mastered
            if progress_service.are_all_questions_mastered_for_tags(tags):
                raise HTTPException(status_code=410, detail="All questions with related tag(s) are mastered")
            else:
                raise HTTPException(status_code=410, detail="No more questions available in this session")
        else:
            raise HTTPException(status_code=500, detail="Failed to get random question")

    return shuffled_question

@router.get("/questions/{question_id}", response_model=Question)
async def get_question(question_id: int, token: dict = Depends(verify_token)):
    """Get a specific question by ID"""
    question = question_service.get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@router.post("/questions/{question_id}/answer", response_model=QuestionResponse)
async def submit_answer(
    question_id: int,
    submission: AnswerSubmission,
    token: dict = Depends(verify_token)
):
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

@router.post("/questions/{question_id}/answer-shuffled", response_model=ShuffledQuestionResponse)
async def submit_shuffled_answer(
    question_id: int,
    submission: AnswerSubmissionWithMapping,
    token: dict = Depends(verify_token)
):
    """Submit answer with reverse mapping support for shuffled questions"""
    question = question_service.get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Use existing logic with reverse mapped answers
    result = question_service.check_answer_with_mapping(
        question_id, submission.selected_answers, submission.original_mapping
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # Record the answer in progress tracking
    progress_service.record_answer(result["is_correct"])

    # Get explanation if requested (use original question for AI)
    explanation = None
    if submission.request_explanation:
        # Convert original correct answers back to shuffled format for display
        original_correct = result["correct_answers"]
        shuffled_correct = AnswerShuffler.map_answers_to_shuffled(
            original_correct, submission.original_mapping
        )

        explanation = get_ai_service().generate_explanation(
            question,
            AnswerShuffler.reverse_map_answers(submission.selected_answers, submission.original_mapping),
            original_correct
        )

    # Get updated question and re-shuffle with same mapping
    updated_question = question_service.get_question_by_id(question_id)

    # Create shuffled response
    shuffled_response_question = ShuffledQuestion(
        question_number=updated_question.question_number,
        question_text=updated_question.question_text,
        answers={k: updated_question.answers[v] for k, v in submission.original_mapping.items()},
        original_mapping=submission.original_mapping,
        tag=updated_question.tag,
        explanation=updated_question.explanation,
        hint=updated_question.hint,
        score=updated_question.score,
        starred=updated_question.starred,
        note=updated_question.note,
        active=updated_question.active,
        case_study=updated_question.case_study,
        placeholder_3=updated_question.placeholder_3
    )

    # Convert correct answers to shuffled format for response
    shuffled_correct_answers = AnswerShuffler.map_answers_to_shuffled(
        result["correct_answers"], submission.original_mapping
    )

    return ShuffledQuestionResponse(
        question=shuffled_response_question,
        is_correct=result["is_correct"],
        correct_answers=shuffled_correct_answers,
        explanation=explanation
    )

@router.get("/questions/{question_id}/hint")
async def get_hint(question_id: int, token: dict = Depends(verify_token)):
    """Get a hint for a specific question"""
    question = question_service.get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    hint = get_ai_service().generate_hint(question)

    # Save the generated hint to the question
    if hint != question.hint:
        question.hint = hint
        question_service.save_question(question)

    return {"hint": hint}

@router.get("/questions/{question_id}/explanation")
async def get_explanation(
    question_id: int,
    regenerate: bool = Query(False),
    token: dict = Depends(verify_token)
):
    """Get explanation for a specific question"""
    question = question_service.get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # For getting explanation without answering, we need the correct answers
    correct_answers = [key for key, answer in question.answers.items() if answer.status == "correct"]

    explanation = get_ai_service().generate_explanation(question, [], correct_answers, force_regenerate=regenerate)

    # Save the generated explanation to the question
    if explanation != question.explanation:
        question.explanation = explanation
        question_service.save_question(question)

    return {"explanation": explanation}

@router.post("/questions/{question_id}/star")
async def toggle_star(
    question_id: int,
    starred: bool = Query(...),
    token: dict = Depends(verify_token)
):
    """Toggle star status for a question"""
    success = question_service.update_question_star(question_id, starred)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"success": True, "starred": starred}

@router.post("/questions/{question_id}/note")
async def update_note(
    question_id: int,
    note: str = Query(...),
    token: dict = Depends(verify_token)
):
    """Add or update a note for a question"""
    success = question_service.update_question_note(question_id, note)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"success": True, "note": note}

@router.get("/case-study/{case_study_name}")
async def get_case_study(case_study_name: str, token: dict = Depends(verify_token)):
    """Get case study content by name"""
    ai_service = get_ai_service()

    # Check if case study exists in mapping
    if case_study_name not in ai_service.CASE_STUDY_MAPPING:
        raise HTTPException(status_code=404, detail="Case study not found")

    # Load case study content
    content = ai_service._load_case_study_content(case_study_name)
    if not content:
        raise HTTPException(status_code=404, detail="Case study content not available")

    return {
        "name": case_study_name,
        "content": content,
        "filename": ai_service.CASE_STUDY_MAPPING[case_study_name]
    }

@router.post("/questions/{question_id}/skip")
async def skip_question(question_id: int, token: dict = Depends(verify_token)):
    """Skip a question - mark it as seen without affecting stats"""
    question = question_service.get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Mark question as shown in session (same as when answering)
    progress_service.record_skip(question_id)

    return {"success": True, "skipped": True}


@router.get("/tags")
async def get_available_tags(token: dict = Depends(verify_token)):
    """Get all available question tags (only from active questions)"""
    questions = question_service.get_all_questions()
    tags = set()
    for question in questions:
        if question.active:  # Only include tags from active questions
            tags.update(question.tag)
    return {"tags": sorted(list(tags))}