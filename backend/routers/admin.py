from fastapi import APIRouter, Depends
from models.user import TokenPayload
from auth_middleware import require_admin
from services.supabase_client import supabase

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users")
def list_users(admin: TokenPayload = Depends(require_admin)):
    result = supabase.table("users").select("*").order("created_at", desc=True).execute()
    return result.data or []


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    role: str,
    admin: TokenPayload = Depends(require_admin),
):
    if role not in ("student", "admin"):
        return {"error": "Invalid role. Must be 'student' or 'admin'."}
    result = supabase.table("users").update({"role": role}).eq("id", user_id).execute()
    if not result.data:
        return {"error": "User not found"}
    return result.data[0]
