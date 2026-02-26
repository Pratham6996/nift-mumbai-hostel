from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from typing import Optional
from models.feedback import FeedbackCreate, FeedbackUpdate, FeedbackCategory
from models.user import TokenPayload
from auth_middleware import get_current_user, require_admin
from services import feedback_service, storage_service

router = APIRouter(prefix="/api", tags=["Feedback"])


def _enrich_feedback(fb: dict) -> dict:
    """Add signed image URL to feedback if it has an image."""
    item = dict(fb)
    image_path = item.get("image_url")
    if image_path and not image_path.startswith("http"):
        # It's a storage path — generate a signed URL
        item["image_url"] = storage_service.get_image_signed_url(image_path)
    elif image_path and image_path.startswith("http"):
        # Legacy full URL — try to extract path and generate signed URL
        bucket_marker = f"{storage_service.BUCKET_NAME}/"
        if bucket_marker in image_path:
            path = image_path.split(bucket_marker, 1)[1]
            signed = storage_service.get_image_signed_url(path)
            if signed:
                item["image_url"] = signed
    return item


@router.get("/feedback")
def list_feedback(
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
):
    feedbacks = feedback_service.get_all_feedback(limit=limit, offset=offset)
    sanitized = []
    for fb in feedbacks:
        item = _enrich_feedback(fb)
        if item.get("is_anonymous"):
            item.pop("user_id", None)
        sanitized.append(item)
    return sanitized


@router.post("/feedback")
async def create_feedback(
    category: FeedbackCategory = Form(...),
    content: str = Form(..., min_length=10, max_length=2000),
    is_anonymous: bool = Form(default=False),
    image: Optional[UploadFile] = File(default=None),
    current_user: TokenPayload = Depends(get_current_user),
):
    image_path = None
    if image and image.filename:
        image_path = await storage_service.upload_image(image, current_user.sub)

    feedback_data = FeedbackCreate(
        category=category,
        content=content,
        is_anonymous=is_anonymous,
    )
    result = feedback_service.create_feedback(current_user.sub, feedback_data, image_path)
    return _enrich_feedback(result)


@router.put("/feedback/{feedback_id}")
def update_feedback(
    feedback_id: str,
    update: FeedbackUpdate,
    current_user: TokenPayload = Depends(get_current_user),
):
    result = feedback_service.update_feedback(feedback_id, current_user.sub, update)
    return _enrich_feedback(result)


@router.post("/feedback/{feedback_id}/upvote")
def upvote_feedback(
    feedback_id: str,
    current_user: TokenPayload = Depends(get_current_user),
):
    result = feedback_service.upvote_feedback(feedback_id, current_user.sub)
    return _enrich_feedback(result)


@router.delete("/admin/feedback/{feedback_id}")
def delete_feedback(
    feedback_id: str,
    admin: TokenPayload = Depends(require_admin),
):
    existing = feedback_service.get_feedback_by_id(feedback_id)
    if existing and existing.get("image_url"):
        storage_service.delete_image(existing["image_url"])
    return feedback_service.delete_feedback(feedback_id)


@router.get("/admin/feedback/stats")
def feedback_stats(admin: TokenPayload = Depends(require_admin)):
    return feedback_service.get_feedback_stats()
