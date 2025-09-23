from google.cloud import storage
import json
import os
from typing import Any, Dict

BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME")
storage_client = storage.Client()

def download_json_from_gcs(source_blob_name: str) -> Dict[str, Any]:
    """Downloads a blob from the bucket and loads it as JSON."""
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

def blob_exists(blob_name: str) -> bool:
    """Check if a blob exists in the bucket."""
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(blob_name)
        return blob.exists()
    except Exception as e:
        print(f"Error checking if {blob_name} exists: {e}")
        return False