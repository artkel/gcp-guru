# backend/scripts/migrate_data.py
import os
import sys
import json

# Add the project root to the Python path to allow importing services
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.firestore_service import set_document, db

def migrate_questions_to_firestore():
    """Reads the local questions JSON file and uploads each question to Firestore."""
    collection_name = "questions"
    local_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'gcp-pca-questions.json')

    print("Starting question data migration to Firestore...")

    try:
        if not os.path.exists(local_path):
            print(f"Error: Local questions file not found at {local_path}")
            return

        with open(local_path, 'r', encoding='utf-8') as f:
            questions_data = json.load(f)
        
        if not isinstance(questions_data, list):
            print("Error: Questions data is not a list.")
            return

        print(f"Found {len(questions_data)} questions to migrate.")

        # Use a batch for efficient writing
        batch = db.batch()
        count = 0
        for question in questions_data:
            doc_id = str(question.get("question_number"))
            if not doc_id:
                print(f"Skipping question with no question_number: {question}")
                continue
            
            doc_ref = db.collection(collection_name).document(doc_id)
            batch.set(doc_ref, question)
            count += 1

            # Firestore batches have a limit of 500 operations
            if count % 499 == 0:
                print(f"Committing batch of {count} questions...")
                batch.commit()
                batch = db.batch() # Start a new batch

        # Commit any remaining questions in the last batch
        if count > 0 and count % 499 != 0:
            print(f"Committing final batch of {count % 499} questions...")
            batch.commit()

        print(f"\nSuccessfully migrated {count} questions to the '{collection_name}' collection in Firestore.")

    except Exception as e:
        print(f"An error occurred during migration: {e}")

if __name__ == "__main__":
    # This allows the script to be run directly, e.g., `python backend/scripts/migrate_data.py`
    # Ensure you have authenticated with `gcloud auth application-default login` first.
    migrate_questions_to_firestore()
