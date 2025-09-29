import os
from typing import Any, Dict, List, Optional

# Get project ID from environment, with a fallback for local development
PROJECT_ID = os.environ.get("GCP_PROJECT") or os.environ.get("PROJECT_ID") or "gcp-guru-473011"

# Initialize Firestore client only if we're in production (with credentials)
db = None
try:
    from google.cloud import firestore
    db = firestore.Client(project=PROJECT_ID)
    print("Firestore client initialized for production")
except Exception as e:
    print(f"Firestore not available (running in development mode): {e}")
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
