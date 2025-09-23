import json
import random
from typing import List, Optional, Dict
from models.question import Question, Answer
import os
from services.gcs_service import download_json_from_gcs, upload_json_to_gcs, blob_exists

class QuestionService:
    def __init__(self):
        self.questions: List[Question] = []
        self.load_questions()

    def load_questions(self):
        """Load questions from GCS bucket"""
        blob_name = 'gcp-pca-questions.json'
        try:
            if blob_exists(blob_name):
                data = download_json_from_gcs(blob_name)
                if data:
                    self.questions = [Question(**q) for q in data]
                    print(f"Loaded {len(self.questions)} questions from GCS: {blob_name}")
                else:
                    print(f"No data found in GCS blob: {blob_name}")
                    self.questions = []
            else:
                print(f"Questions file not found in GCS: {blob_name}")
                self.questions = []
        except Exception as e:
            print(f"Error loading questions from GCS: {e}")
            self.questions = []

    def save_questions(self):
        """Save questions back to GCS bucket"""
        blob_name = 'gcp-pca-questions.json'
        try:
            data = [q.dict() for q in self.questions]
            success = upload_json_to_gcs(data, blob_name)
            if success:
                print(f"Successfully saved {len(self.questions)} questions to GCS: {blob_name}")
            else:
                print(f"Failed to save questions to GCS: {blob_name}")
        except Exception as e:
            print(f"Error saving questions to GCS: {e}")

    def get_all_questions(self) -> List[Question]:
        """Get all questions"""
        return self.questions

    def get_question_by_id(self, question_id: int) -> Optional[Question]:
        """Get a specific question by ID"""
        for q in self.questions:
            if q.question_number == question_id:
                return q
        return None

    def get_random_question(self, tags: Optional[List[str]] = None) -> Optional[Question]:
        """Get a random question using sophisticated probability-based selection"""
        from services.progress_service import progress_service

        # Debug logging
        print(f"DEBUG: get_random_question called with tags: {tags}")

        # Get available questions (not shown in session, score < 4)
        available_questions = progress_service.get_available_questions_for_tags(tags)
        print(f"DEBUG: Available questions count: {len(available_questions)}")
        if len(available_questions) == 0:
            print(f"DEBUG: No available questions for tags {tags}")
            all_tag_questions = [q for q in self.questions if not tags or any(tag in q.tag for tag in tags)]
            print(f"DEBUG: Total questions with tags: {len(all_tag_questions)}")
            for q in all_tag_questions:
                shown = progress_service.is_question_shown_in_session(q.question_number)
                print(f"DEBUG: Question {q.question_number} - score: {q.score}, shown: {shown}")


        if not available_questions:
            # No more questions available for this session
            return None

        # Calculate probability weights based on scores
        weights = []
        for q in available_questions:
            weight = self._calculate_question_weight(q.score)
            weights.append(weight)

        # Select question using weighted random choice
        selected_question = random.choices(available_questions, weights=weights, k=1)[0]

        # Track that this question has been shown in the current session
        progress_service.add_question_to_session(selected_question.question_number)

        return selected_question

    def _calculate_question_weight(self, score: int) -> float:
        """Calculate probability weight based on question score

        Score mapping to weights:
        -1 -> 1.5 (high priority for difficult questions)
        0  -> 1.0 (normal probability)
        1  -> 0.65 (reduced probability)
        2  -> 0.4 (low probability)
        3  -> 0.2 (very low probability)
        4+ -> 0 (excluded - not available)

        This creates the desired probability distribution where
        negative scores get higher probability, positive scores get lower probability
        """
        weight_map = {
            -1: 1.5,
            0: 1.0,
            1: 0.65,
            2: 0.4,
            3: 0.2
        }
        return weight_map.get(score, 0.0)

    def check_answer(self, question_id: int, selected_answers: List[str]) -> Dict:
        """Check if the submitted answers are correct"""
        question = self.get_question_by_id(question_id)
        if not question:
            return {"error": "Question not found"}

        correct_answers = [key for key, answer in question.answers.items() if answer.status == "correct"]
        selected_set = set(selected_answers)
        correct_set = set(correct_answers)

        is_correct = selected_set == correct_set

        # Update score based on adaptive learning algorithm
        if is_correct:
            question.score = min(4, question.score + 1)
        else:
            question.score = max(-1, question.score - 1)

        self.save_questions()

        return {
            "is_correct": is_correct,
            "correct_answers": correct_answers,
            "selected_answers": selected_answers,
            "new_score": question.score
        }

    def update_question_star(self, question_id: int, starred: bool) -> bool:
        """Toggle star status for a question"""
        question = self.get_question_by_id(question_id)
        if question:
            question.starred = starred
            self.save_questions()
            return True
        return False

    def update_question_note(self, question_id: int, note: str) -> bool:
        """Update note for a question"""
        question = self.get_question_by_id(question_id)
        if question:
            question.note = note
            self.save_questions()
            return True
        return False

    def get_questions_by_tags(self, tags: List[str]) -> List[Question]:
        """Get questions filtered by tags (only active questions)"""
        return [q for q in self.questions if q.active and any(tag in q.tag for tag in tags)]

    def search_questions(self, query: str) -> List[Question]:
        """Search questions by text content (only active questions)"""
        query_lower = query.lower()
        results = []

        for q in self.questions:
            if not q.active:  # Skip inactive questions
                continue

            if query_lower in q.question_text.lower():
                results.append(q)
                continue

            # Search in answer texts
            for answer in q.answers.values():
                if query_lower in answer.answer_text.lower():
                    results.append(q)
                    break

        return results

    def clear_all_explanations(self) -> bool:
        """Clear all explanations from active questions only"""
        try:
            for question in self.questions:
                if question.active:  # Only clear explanations from active questions
                    question.explanation = ""
            self.save_questions()
            return True
        except Exception as e:
            print(f"Error clearing explanations: {e}")
            return False

    def clear_all_hints(self) -> bool:
        """Clear all hints from active questions only"""
        try:
            for question in self.questions:
                if question.active:  # Only clear hints from active questions
                    question.hint = ""
            self.save_questions()
            return True
        except Exception as e:
            print(f"Error clearing hints: {e}")
            return False

# Global instance
question_service = QuestionService()