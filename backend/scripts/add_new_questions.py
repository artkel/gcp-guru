# backend/scripts/add_new_questions.py
"""
Script to add new questions to Firestore without overwriting existing data.
This preserves user progress (scores, hints, explanations, stars, notes).

Usage:
1. Create a JSON file with your new questions (e.g., new_questions.json)
2. Run: python backend/scripts/add_new_questions.py path/to/new_questions.json
"""

import os
import sys
import json
from typing import List, Dict

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.firestore_service import get_document, set_document

def add_new_questions_to_firestore(new_questions_file: str, overwrite: bool = False):
    """
    Add new questions to Firestore.

    Args:
        new_questions_file: Path to JSON file with new questions
        overwrite: If True, overwrites existing questions. If False, only adds new ones.
    """
    collection_name = "questions"

    print(f"Reading new questions from {new_questions_file}...")

    try:
        with open(new_questions_file, 'r', encoding='utf-8') as f:
            new_questions = json.load(f)

        if not isinstance(new_questions, list):
            print("Error: Questions data must be a list.")
            return

        print(f"Found {len(new_questions)} questions in the file.")

        added_count = 0
        skipped_count = 0
        updated_count = 0

        for question in new_questions:
            question_number = question.get("question_number")
            if not question_number:
                print(f"Skipping question with no question_number: {question}")
                skipped_count += 1
                continue

            doc_id = str(question_number)

            # Check if question already exists
            existing = get_document(collection_name, doc_id)

            if existing and not overwrite:
                print(f"Question {question_number} already exists. Skipping (use --overwrite to replace).")
                skipped_count += 1
                continue

            if existing and overwrite:
                # Preserve user data when overwriting
                question['score'] = existing.get('score', 0)
                question['starred'] = existing.get('starred', False)
                question['note'] = existing.get('note', '')
                question['explanation'] = existing.get('explanation', '')
                question['hint'] = existing.get('hint', '')
                print(f"Updating question {question_number} (preserving user data)...")
                updated_count += 1
            else:
                print(f"Adding new question {question_number}...")
                added_count += 1

            # Ensure default fields exist
            question.setdefault('score', 0)
            question.setdefault('starred', False)
            question.setdefault('note', '')
            question.setdefault('explanation', '')
            question.setdefault('hint', '')
            question.setdefault('active', True)
            question.setdefault('case_study', '')
            question.setdefault('placeholder_3', '')

            # Add to Firestore
            set_document(collection_name, doc_id, question)

        print(f"\n✓ Complete!")
        print(f"  - Added: {added_count} new questions")
        print(f"  - Updated: {updated_count} existing questions")
        print(f"  - Skipped: {skipped_count} questions")

    except FileNotFoundError:
        print(f"Error: File not found: {new_questions_file}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in file: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/scripts/add_new_questions.py <path_to_new_questions.json> [--overwrite]")
        print("\nExample:")
        print("  python backend/scripts/add_new_questions.py data/new_questions.json")
        print("\nOptions:")
        print("  --overwrite: Update existing questions (preserves user data like scores, notes)")
        sys.exit(1)

    file_path = sys.argv[1]
    overwrite = '--overwrite' in sys.argv

    # Ensure authenticated
    print("Note: Ensure you've run 'gcloud auth application-default login' first.\n")

    add_new_questions_to_firestore(file_path, overwrite)
