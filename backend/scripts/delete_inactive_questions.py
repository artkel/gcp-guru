# backend/scripts/delete_inactive_questions.py
"""
Script to permanently delete all inactive questions from Firestore.
This removes questions where active=False from the database.

⚠️  WARNING: This operation is IRREVERSIBLE. Ensure you have a backup.

Usage:
    python backend/scripts/delete_inactive_questions.py [--dry-run]

Options:
    --dry-run    Preview what will be deleted without actually deleting
"""

import os
import sys
from typing import List, Dict

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.firestore_service import get_all_documents, delete_document

def find_inactive_questions() -> List[Dict]:
    """
    Find all questions in Firestore where active=False.

    Returns:
        List of inactive question documents
    """
    collection_name = "questions"

    print("Fetching all questions from Firestore...")
    all_questions = get_all_documents(collection_name)

    # Filter for inactive questions
    inactive_questions = [
        q for q in all_questions
        if not q.get('active', True)  # active=False or missing active field
    ]

    return inactive_questions

def delete_inactive_questions(dry_run: bool = False):
    """
    Delete all inactive questions from Firestore.

    Args:
        dry_run: If True, only preview what will be deleted without actually deleting
    """
    collection_name = "questions"

    # Find inactive questions
    inactive_questions = find_inactive_questions()

    if not inactive_questions:
        print("\n✓ No inactive questions found. Nothing to delete.")
        return

    # Sort by question number for display
    inactive_questions.sort(key=lambda x: x.get('question_number', 0))

    print(f"\n{'='*70}")
    print(f"Found {len(inactive_questions)} inactive question(s):")
    print(f"{'='*70}\n")

    # Display list of questions to be deleted
    for q in inactive_questions:
        question_number = q.get('question_number', 'N/A')
        question_text = q.get('question_text', 'N/A')
        # Truncate long question text
        text_preview = question_text[:80] + "..." if len(question_text) > 80 else question_text
        print(f"  #{question_number}: {text_preview}")

    print(f"\n{'='*70}")

    if dry_run:
        print("\n🔍 DRY RUN MODE - No questions will be deleted")
        print(f"   {len(inactive_questions)} question(s) would be deleted")
        return

    # Ask for confirmation
    print("\n⚠️  WARNING: This will permanently delete these questions from Firestore!")
    print("   This operation cannot be undone.")

    response = input("\nType 'DELETE' to confirm deletion: ")

    if response != "DELETE":
        print("\n✗ Deletion cancelled.")
        return

    # Proceed with deletion
    print(f"\nDeleting {len(inactive_questions)} question(s)...\n")

    deleted_count = 0
    failed_count = 0
    failed_questions = []

    for q in inactive_questions:
        question_number = q.get('question_number')
        doc_id = str(question_number)

        success = delete_document(collection_name, doc_id)

        if success:
            print(f"✓ Deleted question #{question_number}")
            deleted_count += 1
        else:
            print(f"✗ Failed to delete question #{question_number}")
            failed_count += 1
            failed_questions.append(question_number)

    # Print summary
    print(f"\n{'='*70}")
    print(f"DELETION SUMMARY:")
    print(f"{'='*70}")
    print(f"  ✓ Successfully deleted: {deleted_count} question(s)")

    if failed_count > 0:
        print(f"  ✗ Failed to delete:     {failed_count} question(s)")
        print(f"\nFailed question numbers: {failed_questions}")

    print(f"{'='*70}\n")

    if deleted_count > 0:
        print("✓ Deletion complete!")
        print("\nNote: Consider running export_questions_from_firestore.py to update your local backup.")

if __name__ == "__main__":
    # Check for dry-run flag
    dry_run = "--dry-run" in sys.argv

    # Ensure authenticated
    print("Note: Ensure you've run 'gcloud auth application-default login' first.\n")

    if dry_run:
        print("Running in DRY RUN mode...\n")

    delete_inactive_questions(dry_run=dry_run)
