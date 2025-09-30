import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, Header
from typing import Optional

# Initialize Firebase Admin SDK
# In production (Cloud Run), this uses Application Default Credentials
# In development, you can use a service account key file
try:
    firebase_admin.get_app()
except ValueError:
    # App not initialized yet
    firebase_admin.initialize_app()

# Email whitelist for single-user access
ALLOWED_EMAILS = [
    "artkel@gmail.com",
]

async def verify_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verify Firebase ID token from Authorization header.
    Returns the decoded token with user info.
    Raises HTTPException if token is invalid or user is not whitelisted.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        # Extract token from "Bearer <token>" format
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization format")

        token = authorization.split("Bearer ")[1]

        # Verify the token with Firebase Admin SDK
        decoded_token = auth.verify_id_token(token)

        # Check if email is in whitelist
        user_email = decoded_token.get("email")
        if user_email not in ALLOWED_EMAILS:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Email {user_email} is not authorized."
            )

        return decoded_token

    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Authentication token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")