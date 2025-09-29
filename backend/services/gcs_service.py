from google.cloud import storage
import json
import os
from typing import Any, Dict

BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME")

# Initialize storage client with error handling for local development
storage_client = None
try:
    storage_client = storage.Client()
    print(f"GCS client initialized successfully for bucket: {BUCKET_NAME}")
except Exception as e:
    print(f"Warning: GCS client initialization failed: {e}")
    print("This is expected for local development without GCS credentials")

def download_json_from_gcs(source_blob_name: str) -> Dict[str, Any]:
    """Downloads a blob from the bucket and loads it as JSON."""
    if storage_client is None:
        raise Exception("GCS client not available - credentials not configured")

    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(source_blob_name)
        data_string = blob.download_as_string()
        return json.loads(data_string)
    except Exception as e:
        print(f"Error downloading {source_blob_name} from GCS: {e}")
        return {}

def upload_json_to_gcs(data: Any, destination_blob_name: str) -> bool:
    """Uploads data as a JSON string to the bucket."""
    if storage_client is None:
        print(f"Warning: Cannot upload {destination_blob_name} - GCS client not available")
        return False

    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_string(
            data=json.dumps(data, indent=2, ensure_ascii=False),
            content_type='application/json'
        )
        return True
    except Exception as e:
        print(f"Error uploading {destination_blob_name} to GCS: {e}")
        return False

def load_from_gcs(filename: str) -> str:
    """Load text content (like markdown files) from GCS bucket."""
    if storage_client is None:
        print(f"Warning: Cannot load {filename} - GCS client not available")
        return ""

    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(filename)
        content = blob.download_as_string()
        return content.decode('utf-8')
    except Exception as e:
        print(f"Error loading {filename} from GCS: {e}")
        return ""

def blob_exists(blob_name: str) -> bool:
    """Check if a blob exists in the bucket."""
    if storage_client is None:
        return False

    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(blob_name)
        return blob.exists()
    except Exception as e:
        print(f"Error checking if {blob_name} exists: {e}")
        return False