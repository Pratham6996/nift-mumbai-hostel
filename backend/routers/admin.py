from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from models.user import TokenPayload
from auth_middleware import require_admin, get_current_user
from services.supabase_client import supabase
from services.cleanup_service import delete_orphaned_images

router = APIRouter(prefix="/api/admin", tags=["Admin"])
limiter = Limiter(key_func=get_remote_address)


class RoleChangeRequest(BaseModel):
    role: str


@router.get("/users")
@limiter.limit("10/minute")
def list_users(request: Request, admin: TokenPayload = Depends(require_admin)):
    result = supabase.table("users").select("*").order("created_at", desc=True).execute()
    return result.data or []


@router.patch("/users/{user_id}/role")
@limiter.limit("5/minute")
def update_user_role(
    request: Request,
    user_id: str,
    body: RoleChangeRequest,
    current_user: TokenPayload = Depends(require_admin),
):
    """Change user role — requires admin access."""
    if body.role not in ("student", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'student' or 'admin'.")
    result = supabase.table("users").update({"role": body.role}).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]


@router.post("/feedback/cleanup-orphaned")
@limiter.limit("5/minute")
def clean_orphaned_feedback_images(request: Request, admin: TokenPayload = Depends(require_admin)):
    """Manually trigger cleanup of orphaned feedback images in storage."""
    result = delete_orphaned_images()
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result
