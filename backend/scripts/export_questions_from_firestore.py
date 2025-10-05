# backend/scripts/export_questions_from_firestore.py
"""
Script to export questions from Firestore to local JSON file.
This syncs Firestore (source of truth) back to local storage.

Usage:
python backend/scripts/export_questions_from_firestore.py
"""

import os
import sys
import json
from typing import List, Dict

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.firestore_service import get_all_documents

def export_questions_from_firestore(output_file: str = None):
    """
    Export all questions from Firestore to a local JSON file.

    Args:
        output_file: Path to output JSON file. Defaults to data/gcp-pca-questions.json
    """
    collection_name = "questions"

    if not output_file:
        output_file = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'gcp-pca-questions.json')

    print(f"Exporting questions from Firestore collection '{collection_name}'...")

    try:
        # Fetch all questions from Firestore
        questions_data = get_all_documents(collection_name)

        if not questions_data:
            print("Warning: No questions found in Firestore.")
            return

        print(f"Found {len(questions_data)} questions in Firestore.")

        # Sort by question_number for consistent ordering
        questions_data.sort(key=lambda x: x.get("question_number", 0))

        # Create backup of existing file if it exists
        if os.path.exists(output_file):
            backup_file = output_file + '.backup'
            print(f"Creating backup of existing file: {backup_file}")
            with open(output_file, 'r', encoding='utf-8') as f:
                backup_data = f.read()
            with open(backup_file, 'w', encoding='utf-8') as f:
                f.write(backup_data)

        # Write to JSON file
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(questions_data, f, indent=2, ensure_ascii=False)

        print(f"\n✓ Successfully exported {len(questions_data)} questions to {output_file}")

        # Print some stats
        active_count = len([q for q in questions_data if q.get('active', True)])
        inactive_count = len(questions_data) - active_count

        print(f"\n📊 Statistics:")
        print(f"   - Total questions: {len(questions_data)}")
        print(f"   - Active questions: {active_count}")
        print(f"   - Inactive questions: {inactive_count}")

        # Show question number range
        question_numbers = [q.get('question_number') for q in questions_data if 'question_number' in q]
        if question_numbers:
            print(f"   - Question number range: {min(question_numbers)} - {max(question_numbers)}")

    except Exception as e:
        print(f"Error exporting questions: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Note: Ensure you've run 'gcloud auth application-default login' first.\n")

    # Optional: allow custom output file via command line
    output_file = sys.argv[1] if len(sys.argv) > 1 else None

    export_questions_from_firestore(output_file)
