from datetime import datetime, timedelta, timezone
from services.supabase_client import supabase
from models.feedback import FeedbackCreate, FeedbackUpdate
from fastapi import HTTPException


EDIT_WINDOW_HOURS = 24


def get_all_feedback(limit: int = 50, offset: int = 0):
    result = (
        supabase.table("feedback")
        .select("*")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []


def get_feedback_by_id(feedback_id: str):
    result = supabase.table("feedback").select("*").eq("id", feedback_id).single().execute()
    return result.data


def create_feedback(user_id: str, feedback: FeedbackCreate, image_url: str = None):
    data = {
        "user_id": user_id,
        "category": feedback.category.value,
        "content": feedback.content,
        "is_anonymous": feedback.is_anonymous,
        "image_url": image_url,
        "upvotes": 0,
    }
    result = supabase.table("feedback").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create feedback")
    return result.data[0]


def update_feedback(feedback_id: str, user_id: str, update: FeedbackUpdate):
    existing = get_feedback_by_id(feedback_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Feedback not found")
    if existing["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="You can only edit your own feedback")

    created_at = datetime.fromisoformat(existing["created_at"].replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    if now - created_at > timedelta(hours=EDIT_WINDOW_HOURS):
        raise HTTPException(status_code=403, detail="Edit window (24 hours) has expired")

    update_data = {}
    if update.category is not None:
        update_data["category"] = update.category.value
    if update.content is not None:
        update_data["content"] = update.content
    update_data["updated_at"] = now.isoformat()

    result = supabase.table("feedback").update(update_data).eq("id", feedback_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update feedback")
    return result.data[0]


def delete_feedback(feedback_id: str):
    existing = get_feedback_by_id(feedback_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Feedback not found")
    supabase.table("feedback").delete().eq("id", feedback_id).execute()
    return existing


def upvote_feedback(feedback_id: str, user_id: str):
    """Toggle upvote — one vote per user per feedback."""
    existing = get_feedback_by_id(feedback_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Feedback not found")

    # Check if user already upvoted
    check = (
        supabase.table("feedback_upvotes")
        .select("id")
        .eq("feedback_id", feedback_id)
        .eq("user_id", user_id)
        .execute()
    )

    if check.data:
        # Already upvoted → remove the upvote (toggle off)
        supabase.table("feedback_upvotes").delete().eq("feedback_id", feedback_id).eq("user_id", user_id).execute()
        new_count = max(existing.get("upvotes", 1) - 1, 0)
    else:
        # Not upvoted yet → add upvote
        supabase.table("feedback_upvotes").insert({
            "feedback_id": feedback_id,
            "user_id": user_id,
        }).execute()
        new_count = existing.get("upvotes", 0) + 1

    result = supabase.table("feedback").update({"upvotes": new_count}).eq("id", feedback_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update upvote count")
    return result.data[0]


def has_user_upvoted(feedback_id: str, user_id: str) -> bool:
    """Check if a user has already upvoted a specific feedback."""
    check = (
        supabase.table("feedback_upvotes")
        .select("id")
        .eq("feedback_id", feedback_id)
        .eq("user_id", user_id)
        .execute()
    )
    return bool(check.data)


def get_feedback_stats():
    result = supabase.table("feedback").select("*").execute()
    all_fb = result.data or []
    total = len(all_fb)
    by_category = {}
    for fb in all_fb:
        cat = fb.get("category", "unknown")
        by_category[cat] = by_category.get(cat, 0) + 1
    return {"total": total, "by_category": by_category}
