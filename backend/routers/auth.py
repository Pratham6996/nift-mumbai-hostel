from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from models.user import TokenPayload, ProfileUpdate
from auth_middleware import get_current_user
from services.supabase_client import supabase

router = APIRouter(prefix="/api/auth", tags=["Auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register")
@limiter.limit("10/minute")
def register_user(request: Request, current_user: TokenPayload = Depends(get_current_user)):
    existing = supabase.table("users").select("id").eq("id", current_user.sub).execute()
    if existing.data:
        return existing.data[0]

    data = {
        "id": current_user.sub,
        "email": current_user.email or "",
        "role": "student",
    }
    result = supabase.table("users").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to register user")
    return result.data[0]


@router.get("/me")
@limiter.limit("30/minute")
def get_me(request: Request, current_user: TokenPayload = Depends(get_current_user)):
    result = supabase.table("users").select("*").eq("id", current_user.sub).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User profile not found. Please register first.")
    return result.data


@router.put("/profile")
@limiter.limit("10/minute")
def update_profile(
    request: Request,
    body: ProfileUpdate,
    current_user: TokenPayload = Depends(get_current_user),
):
    """Update user profile details (name, department, year). Marks profile as complete."""
    update_data = {
        "full_name": body.full_name.strip(),
        "department": body.department.strip(),
        "year": body.year.strip(),
        "profile_complete": True,
    }
    result = (
        supabase.table("users")
        .update(update_data)
        .eq("id", current_user.sub)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]
