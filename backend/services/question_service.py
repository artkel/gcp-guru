import json
import random
from typing import List, Optional, Dict
from models.question import Question, Answer, ShuffledQuestion
from services.answer_shuffler import AnswerShuffler
import os
from services.firestore_service import get_all_documents, set_document

class QuestionService:
    def __init__(self):
        self.questions: List[Question] = []
        self._questions_loaded = False
        self.questions_collection = "questions"

    def _ensure_questions_loaded(self):
        """Ensure questions are loaded from Firestore (lazy loading)"""
        if not self._questions_loaded:
            self.load_questions()
            self._questions_loaded = True

    def load_questions(self):
        """Load questions from Firestore. In a deployed environment, this is the only source."""
        print("Attempting to load questions from Firestore...")
        try:
            all_question_data = get_all_documents(self.questions_collection)
            
            if not all_question_data:
                # This will cause the service to crash on startup if the DB is empty or unreachable
                raise RuntimeError("Firestore 'questions' collection is empty or could not be read. Please verify database content and service account permissions.")

            self._parse_questions_data(all_question_data, "Firestore")

        except Exception as e:
            # Re-raise the exception to ensure the service fails to start
            print(f"A critical error occurred while loading questions from Firestore: {e}")
            raise e

    def _load_questions_from_local_file(self, and_save_to_firestore: bool = False):
        """Load questions from local JSON file as fallback and optionally save to Firestore."""
        local_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'gcp-pca-questions.json')
        try:
            if os.path.exists(local_path):
                with open(local_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self._parse_questions_data(data, "local file")

                if and_save_to_firestore:
                    print("Saving loaded local questions to Firestore...")
                    for question in self.questions:
                        self.save_question(question, skip_local_save=True)
                    print("Finished saving local questions to Firestore.")
            else:
                print(f"Local questions file not found: {local_path}")
                self.questions = []
        except Exception as e:
            print(f"Error loading questions from local file: {e}")
            self.questions = []

    def _parse_questions_data(self, data: List[Dict], source: str):
        """Parse question data from a list of dicts and create Question objects"""
        try:
            # Sort data by question_number to ensure consistent order
            data.sort(key=lambda x: x.get("question_number", 0))

            parsed_questions = []
            for item in data:
                # Convert answers to the expected format
                # IMPORTANT: Sort answers by key (a, b, c, d, etc.) to ensure correct order
                answers_dict = {}
                sorted_answer_keys = sorted(item.get("answers", {}).keys())
                for key in sorted_answer_keys:
                    answer_data = item.get("answers", {})[key]
                    if isinstance(answer_data, dict):
                        answers_dict[key] = Answer(
                            answer_text=answer_data.get("answer_text", ""),
                            status=answer_data.get("status", "incorrect")
                        )
                    else:
                        # Handle legacy format
                        answers_dict[key] = Answer(answer_text=str(answer_data), status="incorrect")

                # Create Question object with sorted answers
                question = Question(
                    question_number=item.get("question_number", 0),
                    question_text=item.get("question_text", ""),
                    answers=answers_dict,
                    tag=item.get("tag", []),
                    explanation=item.get("explanation", ""),
                    hint=item.get("hint", ""),
                    score=item.get("score", 0),
                    starred=item.get("starred", False),
                    note=item.get("note", ""),
                    active=item.get("active", True),
                    case_study=item.get("case_study", ""),
                    placeholder_3=item.get("placeholder_3", "")
                )
                parsed_questions.append(question)

            self.questions = parsed_questions
            self._questions_loaded = True
            print(f"Loaded {len(self.questions)} questions from {source}")
        except Exception as e:
            print(f"Error parsing questions data from {source}: {e}")
            self.questions = []

    def save_question(self, question: Question, skip_local_save: bool = False):
        """Save a single question to Firestore and optionally to a local file."""
        try:
            # Firestore uses the question number as the document ID
            document_id = str(question.question_number)
            set_document(self.questions_collection, document_id, question.dict())

            # For local development, we can keep saving to the JSON file as well
            if not skip_local_save:
                self._save_all_questions_to_local_file()

        except Exception as e:
            print(f"Error saving question {question.question_number}: {e}")

    def _save_all_questions_to_local_file(self):
        """Saves the entire current list of questions to the local JSON file."""
        blob_name = 'gcp-pca-questions.json'
        local_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', blob_name)
        try:
            # Ensure questions are loaded before saving
            self._ensure_questions_loaded()
            data = [q.dict() for q in self.questions]
            with open(local_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving questions to local file {local_path}: {e}")


    def get_all_questions(self) -> List[Question]:
        """Get all questions"""
        self._ensure_questions_loaded()
        return self.questions

    def get_question_by_id(self, question_id: int) -> Optional[Question]:
        """Get a specific question by ID"""
        self._ensure_questions_loaded()
        for q in self.questions:
            if q.question_number == question_id:
                return q
        return None

    def get_random_question(self, tags: Optional[List[str]] = None, mastery_levels: Optional[List[str]] = None) -> Optional[Question]:
        """Get a random question using sophisticated probability-based selection"""
        from services.progress_service import progress_service

        available_questions = progress_service.get_available_questions_for_tags(tags, mastery_levels)

        if not available_questions:
            return None

        weights = [self._calculate_question_weight(q.score) for q in available_questions]

        if all(w == 0.0 for w in weights):
            selected_question = random.choice(available_questions)
        else:
            selected_question = random.choices(available_questions, weights=weights, k=1)[0]

        return selected_question

    def get_random_shuffled_question(self, tags: Optional[List[str]] = None, mastery_levels: Optional[List[str]] = None) -> Optional[ShuffledQuestion]:
        """Get a random question with shuffled answers"""
        base_question = self.get_random_question(tags, mastery_levels)
        if not base_question:
            return None

        shuffled_question = AnswerShuffler.shuffle_answers(base_question)
        return shuffled_question

    def check_answer_with_mapping(self, question_id: int, selected_answers: List[str],
                                original_mapping: Dict[str, str]) -> Dict:
        """Check answers with reverse mapping to original keys"""
        original_selections = AnswerShuffler.reverse_map_answers(
            selected_answers, original_mapping
        )
        return self.check_answer(question_id, original_selections)

    def _calculate_question_weight(self, score: int) -> float:
        """Calculate probability weight based on question score"""
        weight_map = { -1: 1.5, 0: 1.0, 1: 0.65, 2: 0.4, 3: 0.2 }
        return weight_map.get(score, 0.05)

    def check_answer(self, question_id: int, selected_answers: List[str]) -> Dict:
        """Check if the submitted answers are correct"""
        from services.progress_service import progress_service

        question = self.get_question_by_id(question_id)
        if not question:
            return {"error": "Question not found"}

        progress_service.add_question_to_session(question_id)

        correct_answers = [key for key, answer in question.answers.items() if answer.status == "correct"]
        selected_set = set(selected_answers)
        correct_set = set(correct_answers)

        is_correct = selected_set == correct_set

        if is_correct:
            question.score = min(4, question.score + 1)
        else:
            question.score = max(-1, question.score - 1)

        self.save_question(question)

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
            self.save_question(question)
            return True
        return False

    def update_question_note(self, question_id: int, note: str) -> bool:
        """Update note for a question"""
        question = self.get_question_by_id(question_id)
        if question:
            question.note = note
            self.save_question(question)
            return True
        return False

    def get_questions_by_tags(self, tags: List[str]) -> List[Question]:
        """Get questions filtered by tags (only active questions)"""
        self._ensure_questions_loaded()
        return [q for q in self.questions if q.active and any(tag in q.tag for tag in tags)]

    def search_questions(self, query: str) -> List[Question]:
        """Search questions by text content (only active questions)"""
        self._ensure_questions_loaded()
        query_lower = query.lower()
        results = []

        for q in self.questions:
            if not q.active:
                continue
            if query_lower in q.question_text.lower():
                results.append(q)
                continue
            for answer in q.answers.values():
                if query_lower in answer.answer_text.lower():
                    results.append(q)
                    break
        return results

    def clear_all_explanations(self) -> bool:
        """Clear all explanations from active questions only"""
        self._ensure_questions_loaded()
        try:
            for question in self.questions:
                if question.active:
                    question.explanation = ""
                    self.save_question(question)
            return True
        except Exception as e:
            print(f"Error clearing explanations: {e}")
            return False

    def clear_all_hints(self) -> bool:
        """Clear all hints from active questions only"""
        self._ensure_questions_loaded()
        try:
            for question in self.questions:
                if question.active:
                    question.hint = ""
                    self.save_question(question)
            return True
        except Exception as e:
            print(f"Error clearing hints: {e}")
            return False

    def reload_questions(self) -> Dict:
        """Reload all questions from Firestore, refreshing the in-memory cache"""
        try:
            # Reset the loaded flag to force a fresh load
            self._questions_loaded = False
            # Load questions from Firestore
            self.load_questions()
            return {
                "success": True,
                "message": f"Successfully reloaded {len(self.questions)} questions from Firestore",
                "questions_count": len(self.questions)
            }
        except Exception as e:
            print(f"Error reloading questions: {e}")
            return {
                "success": False,
                "message": f"Failed to reload questions: {str(e)}",
                "questions_count": 0
            }

# Global instance
question_service = QuestionService()