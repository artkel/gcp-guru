# backend/scripts/deactivate_questions.py
"""
Script to deactivate questions in Firestore by setting their 'active' field to False.
This prevents the questions from appearing during training sessions.

Usage:
    python backend/scripts/deactivate_questions.py 234 255 301
    python backend/scripts/deactivate_questions.py 234,255,301
"""

import os
import sys
from typing import List

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.firestore_service import get_document, set_document

def deactivate_questions(question_numbers: List[int]):
    """
    Deactivate questions in Firestore by setting their 'active' field to False.

    Args:
        question_numbers: List of question numbers to deactivate
    """
    collection_name = "questions"

    print(f"Deactivating {len(question_numbers)} question(s)...\n")

    deactivated_count = 0
    not_found_count = 0
    already_inactive_count = 0

    for question_number in question_numbers:
        doc_id = str(question_number)

        # Check if question exists
        existing = get_document(collection_name, doc_id)

        if not existing:
            print(f"✗ Question {question_number} not found in Firestore")
            not_found_count += 1
            continue

        # Check if already inactive
        if not existing.get('active', True):
            print(f"○ Question {question_number} is already inactive")
            already_inactive_count += 1
            continue

        # Update the question to set active=False
        existing['active'] = False
        set_document(collection_name, doc_id, existing)

        print(f"✓ Question {question_number} deactivated")
        deactivated_count += 1

    print(f"\n{'='*50}")
    print(f"Summary:")
    print(f"  - Deactivated: {deactivated_count} questions")
    print(f"  - Already inactive: {already_inactive_count} questions")
    print(f"  - Not found: {not_found_count} questions")
    print(f"{'='*50}")

def parse_question_numbers(args: List[str]) -> List[int]:
    """
    Parse question numbers from command line arguments.
    Supports both space-separated and comma-separated formats.

    Args:
        args: Command line arguments

    Returns:
        List of question numbers as integers
    """
    question_numbers = []

    for arg in args:
        # Split by comma if present
        parts = arg.split(',')
        for part in parts:
            part = part.strip()
            if part:
                try:
                    question_numbers.append(int(part))
                except ValueError:
                    print(f"Warning: Skipping invalid question number: {part}")

    return question_numbers

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/scripts/deactivate_questions.py <question_numbers>")
        print("\nExamples:")
        print("  python backend/scripts/deactivate_questions.py 234 255")
        print("  python backend/scripts/deactivate_questions.py 234,255,301")
        sys.exit(1)

    # Parse question numbers from arguments
    question_numbers = parse_question_numbers(sys.argv[1:])

    if not question_numbers:
        print("Error: No valid question numbers provided")
        sys.exit(1)

    # Ensure authenticated
    print("Note: Ensure you've run 'gcloud auth application-default login' first.\n")

    deactivate_questions(question_numbers)
