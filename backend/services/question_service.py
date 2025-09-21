import json
import random
from typing import List, Optional, Dict
from models.question import Question, Answer
import os

class QuestionService:
    def __init__(self):
        self.questions: List[Question] = []
        self.load_questions()

    def load_questions(self):
        """Load questions from JSON file"""
        questions_file = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'gcp-pca-questions.json')
        try:
            with open(questions_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.questions = [Question(**q) for q in data]
                print(f"Loaded {len(self.questions)} questions from {questions_file}")
        except FileNotFoundError:
            print(f"Questions file not found: {questions_file}")
            self.questions = []
        except Exception as e:
            print(f"Error loading questions: {e}")
            self.questions = []

    def save_questions(self):
        """Save questions back to JSON file"""
        questions_file = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'gcp-pca-questions.json')
        try:
            data = [q.dict() for q in self.questions]
            with open(questions_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving questions: {e}")

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
        """Get questions filtered by tags"""
        return [q for q in self.questions if any(tag in q.tag for tag in tags)]

    def search_questions(self, query: str) -> List[Question]:
        """Search questions by text content"""
        query_lower = query.lower()
        results = []

        for q in self.questions:
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
        """Clear all explanations from all questions"""
        try:
            for question in self.questions:
                question.explanation = ""
            self.save_questions()
            return True
        except Exception as e:
            print(f"Error clearing explanations: {e}")
            return False

    def clear_all_hints(self) -> bool:
        """Clear all hints from all questions"""
        try:
            for question in self.questions:
                question.hint = ""
            self.save_questions()
            return True
        except Exception as e:
            print(f"Error clearing hints: {e}")
            return False

# Global instance
question_service = QuestionService()