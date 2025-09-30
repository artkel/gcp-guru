import os
from typing import Any, Dict, List, Optional

# Get project and database ID from specific environment variables
PROJECT_ID = os.environ.get("GCP_PROJECT_ID")
DATABASE_ID = os.environ.get("GCP_FIRESTORE_DATABASE", "(default)") # Default to '(default)'

# Initialize Firestore client
db = None
try:
    from google.cloud import firestore
    if PROJECT_ID:
        db = firestore.Client(project=PROJECT_ID, database=DATABASE_ID)
        print(f"Firestore client initialized for project '{PROJECT_ID}' and database '{DATABASE_ID}'")
    else:
        # Fallback for local development
        db = firestore.Client()
        print("Firestore client initialized with default project and database.")
except Exception as e:
    print(f"Could not initialize Firestore client: {e}")
    db = None

def get_document(collection: str, document_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a single document from a Firestore collection."""
    if db is None:
        print(f"Firestore not available - cannot get document {document_id} from {collection}")
        return None
    try:
        doc_ref = db.collection(collection).document(document_id)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None
    except Exception as e:
        print(f"Error getting document {document_id} from {collection}: {e}")
        return None

def get_all_documents(collection: str) -> List[Dict[str, Any]]:
    """Fetches all documents from a Firestore collection."""
    if db is None:
        print(f"Firestore not available - cannot get documents from {collection}")
        return []
    try:
        docs = db.collection(collection).stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        print(f"Error getting all documents from {collection}: {e}")
        return []

def set_document(collection: str, document_id: str, data: Dict[str, Any]) -> bool:
    """Creates or overwrites a document in a Firestore collection."""
    if db is None:
        print(f"Firestore not available - cannot set document {document_id} in {collection}")
        return False
    try:
        db.collection(collection).document(document_id).set(data)
        return True
    except Exception as e:
        print(f"Error setting document {document_id} in {collection}: {e}")
        return False

def update_document(collection: str, document_id: str, data: Dict[str, Any]) -> bool:
    """Updates fields in a document in a Firestore collection."""
    if db is None:
        print(f"Firestore not available - cannot update document {document_id} in {collection}")
        return False
    try:
        db.collection(collection).document(document_id).update(data)
        return True
    except Exception as e:
        print(f"Error updating document {document_id} in {collection}: {e}")
        return False

def delete_document(collection: str, document_id: str) -> bool:
    """Deletes a document from a Firestore collection."""
    if db is None:
        print(f"Firestore not available - cannot delete document {document_id} in {collection}")
        return False
    try:
        db.collection(collection).document(document_id).delete()
        return True
    except Exception as e:
        print(f"Error deleting document {document_id} in {collection}: {e}")
        return False
