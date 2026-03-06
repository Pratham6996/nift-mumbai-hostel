import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address

from services.supabase_client import supabase
from services.email_service import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["Verification"])
limiter = Limiter(key_func=get_remote_address)

OTP_EXPIRY_MINUTES = 10


class SendOtpRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


@router.post("/send-otp")
@limiter.limit("5/minute")
def send_otp(request: Request, body: SendOtpRequest):
    """Generate and email a 6-digit OTP. Stores hashed OTP + password for later verification."""
    email = body.email.lower().strip()

    # Validate password length
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Check if email is already registered in Supabase auth
    try:
        existing = supabase.auth.admin.list_users()
        for u in existing:
            if getattr(u, "email", None) and u.email.lower() == email:
                raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in.")
    except HTTPException:
        raise
    except Exception:
        pass  # If check fails, proceed anyway — verify-otp will catch duplicates

    # Generate 6-digit OTP
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    otp_hash = _hash_otp(otp_code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # Clean up any existing OTPs for this email
    supabase.table("email_otps").delete().eq("email", email).execute()

    # Store OTP record (password stored temporarily — will be used to create account after verification)
    supabase.table("email_otps").insert({
        "email": email,
        "otp_hash": otp_hash,
        "password_temp": body.password,
        "expires_at": expires_at.isoformat(),
    }).execute()

    # Send OTP email
    try:
        send_otp_email(email, otp_code)
    except Exception as e:
        # Clean up on email failure
        supabase.table("email_otps").delete().eq("email", email).execute()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Verification code sent to your email"}


@router.post("/verify-otp")
@limiter.limit("10/minute")
def verify_otp(request: Request, body: VerifyOtpRequest):
    """Verify OTP and create the Supabase auth account."""
    email = body.email.lower().strip()
    otp_hash = _hash_otp(body.otp.strip())

    # Look up OTP record
    result = (
        supabase.table("email_otps")
        .select("*")
        .eq("email", email)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=400, detail="No verification code found. Please request a new one.")

    record = result.data[0]

    # Check expiry
    expires_at = datetime.fromisoformat(record["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        supabase.table("email_otps").delete().eq("email", email).execute()
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    # Check OTP match
    if record["otp_hash"] != otp_hash:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please try again.")

    # Create Supabase auth user
    password = record["password_temp"]
    try:
        supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"role": "student"},
        })
    except Exception as e:
        error_msg = str(e)
        print(f"[AUTH ERROR] admin.create_user failed for {email}: {error_msg}")
        print(f"[AUTH ERROR] Exception type: {type(e).__name__}")
        if "already" in error_msg.lower():
            supabase.table("email_otps").delete().eq("email", email).execute()
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        raise HTTPException(status_code=500, detail=f"Failed to create account: {error_msg}")

    # Clean up OTP record
    supabase.table("email_otps").delete().eq("email", email).execute()

    return {"message": "Account created successfully! You can now sign in."}
