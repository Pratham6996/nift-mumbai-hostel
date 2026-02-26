import os
import uuid
from datetime import datetime
from fastapi import UploadFile, HTTPException
from services.supabase_client import supabase

BUCKET_NAME = "feedback-images"
MAX_FILE_SIZE = 1 * 1024 * 1024  # 1MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

# Backend base URL for serving images
BACKEND_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")


async def upload_image(file: UploadFile, user_id: str) -> str:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 1MB limit")

    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"{user_id}/{timestamp}_{uuid.uuid4().hex[:8]}.{ext}"

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=filename,
            file=contents,
            file_options={"content-type": file.content_type},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

    # Store the path, not the full URL — we'll generate signed URLs on-the-fly
    return filename


def get_image_signed_url(path: str) -> str:
    """Generate a signed URL that expires in 1 hour."""
    if not path:
        return None
    try:
        result = supabase.storage.from_(BUCKET_NAME).create_signed_url(path, 3600)
        return result.get("signedURL") or result.get("signedUrl") or ""
    except Exception:
        return ""


def delete_image(image_path: str):
    if not image_path:
        return
    try:
        supabase.storage.from_(BUCKET_NAME).remove([image_path])
    except Exception:
        pass
