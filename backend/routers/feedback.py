from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, Request
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from models.feedback import FeedbackCreate, FeedbackUpdate, FeedbackCategory
from models.user import TokenPayload
from auth_middleware import get_current_user, require_admin
from services import feedback_service, storage_service

router = APIRouter(prefix="/api", tags=["Feedback"])
limiter = Limiter(key_func=get_remote_address)


async def get_optional_user(request: Request) -> Optional[TokenPayload]:
    """Return current user if authenticated, else None."""
    from fastapi.security import HTTPBearer
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    try:
        from fastapi.security import HTTPAuthorizationCredentials
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=auth_header.split(" ", 1)[1])
        from auth_middleware import _decode_token
        payload = _decode_token(creds.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None
        return TokenPayload(sub=user_id, email=payload.get("email"), role=payload.get("role"), exp=payload.get("exp"))
    except Exception:
        return None


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
@limiter.limit("30/minute")
async def list_feedback(
    request: Request,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: Optional[TokenPayload] = Depends(get_optional_user),
):
    feedbacks = feedback_service.get_all_feedback(limit=limit, offset=offset)
    user_id = current_user.sub if current_user else None

    # Batch-fetch author names for non-anonymous posts
    non_anon_user_ids = list({
        fb["user_id"] for fb in feedbacks
        if not fb.get("is_anonymous") and fb.get("user_id")
    })
    user_names = feedback_service.get_user_names(non_anon_user_ids)

    sanitized = []
    for fb in feedbacks:
        item = _enrich_feedback(fb)
        if item.get("is_anonymous"):
            item.pop("user_id", None)
            item["author_name"] = None
        else:
            item["author_name"] = user_names.get(fb.get("user_id", ""), None)
        # Add per-user upvote status
        if user_id:
            item["has_upvoted"] = feedback_service.has_user_upvoted(fb["id"], user_id)
        else:
            item["has_upvoted"] = False
        sanitized.append(item)
    return sanitized


@router.post("/feedback")
@limiter.limit("10/minute")
async def create_feedback(
    request: Request,
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
@limiter.limit("10/minute")
def update_feedback(
    request: Request,
    feedback_id: str,
    update: FeedbackUpdate,
    current_user: TokenPayload = Depends(get_current_user),
):
    result = feedback_service.update_feedback(feedback_id, current_user.sub, update)
    return _enrich_feedback(result)


@router.post("/feedback/{feedback_id}/upvote")
@limiter.limit("20/minute")
def upvote_feedback(
    request: Request,
    feedback_id: str,
    current_user: TokenPayload = Depends(get_current_user),
):
    result = feedback_service.upvote_feedback(feedback_id, current_user.sub)
    return _enrich_feedback(result)


@router.delete("/admin/feedback/{feedback_id}")
@limiter.limit("5/minute")
def delete_feedback(
    request: Request,
    feedback_id: str,
    admin: TokenPayload = Depends(require_admin),
):
    existing = feedback_service.get_feedback_by_id(feedback_id)
    if existing and existing.get("image_url"):
        storage_service.delete_image(existing["image_url"])
    return feedback_service.delete_feedback(feedback_id)


@router.get("/admin/feedback/stats")
@limiter.limit("10/minute")
def feedback_stats(request: Request, admin: TokenPayload = Depends(require_admin)):
    return feedback_service.get_feedback_stats()
