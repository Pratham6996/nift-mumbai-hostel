from fastapi import APIRouter, Depends, HTTPException
from models.user import TokenPayload
from auth_middleware import get_current_user
from services.supabase_client import supabase

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register")
def register_user(current_user: TokenPayload = Depends(get_current_user)):
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
def get_me(current_user: TokenPayload = Depends(get_current_user)):
    result = supabase.table("users").select("*").eq("id", current_user.sub).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User profile not found. Please register first.")
    return result.data
