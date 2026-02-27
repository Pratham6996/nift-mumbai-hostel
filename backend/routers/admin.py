from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from models.user import TokenPayload
from auth_middleware import require_admin, get_current_user
from services.supabase_client import supabase

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class RoleChangeRequest(BaseModel):
    role: str


@router.get("/users")
def list_users(admin: TokenPayload = Depends(require_admin)):
    result = supabase.table("users").select("*").order("created_at", desc=True).execute()
    return result.data or []


@router.patch("/users/{user_id}/role")
def update_user_role(
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
