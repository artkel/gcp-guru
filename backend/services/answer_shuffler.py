import random
from typing import Dict, List
from models.question import Question, Answer, ShuffledQuestion

class AnswerShuffler:
    @staticmethod
    def shuffle_answers(question: Question) -> ShuffledQuestion:
        """
        Shuffle answer content while keeping letters in alphabetical order

        Returns:
            - ShuffledQuestion with A, B, C, D in order but randomized content
            - original_mapping: {'A': 'C', 'B': 'A', 'C': 'D', 'D': 'B'}
              Maps current letters to original letters
        """
        original_keys = list(question.answers.keys())
        shuffled_original_keys = original_keys.copy()
        random.shuffle(shuffled_original_keys)  # Shuffle the original keys order

        # Keep letters in alphabetical order, supporting up to 6 answers
        display_keys = ['A', 'B', 'C', 'D', 'E', 'F'][:len(original_keys)]

        # Create new answers dict with alphabetical letters but shuffled content
        shuffled_answers = {}
        original_mapping = {}

        for i, display_key in enumerate(display_keys):
            original_key = shuffled_original_keys[i]
            shuffled_answers[display_key] = question.answers[original_key]
            original_mapping[display_key] = original_key

        # Create shuffled question by manually setting fields to avoid conflicts
        return ShuffledQuestion(
            question_number=question.question_number,
            question_text=question.question_text,
            answers=shuffled_answers,
            original_mapping=original_mapping,
            tag=question.tag,
            explanation=question.explanation,
            hint=question.hint,
            score=question.score,
            starred=question.starred,
            note=question.note,
            active=question.active,
            case_study=question.case_study,
            placeholder_3=question.placeholder_3
        )

    @staticmethod
    def reverse_map_answers(shuffled_answers: List[str], mapping: Dict[str, str]) -> List[str]:
        """Convert shuffled answer selections back to original keys"""
        return [mapping[answer] for answer in shuffled_answers]

    @staticmethod
    def map_answers_to_shuffled(original_answers: List[str], mapping: Dict[str, str]) -> List[str]:
        """Convert original answer keys to shuffled keys"""
        # Create reverse mapping (original -> shuffled)
        reverse_mapping = {v: k for k, v in mapping.items()}
        return [reverse_mapping[answer] for answer in original_answers]