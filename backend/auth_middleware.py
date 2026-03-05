import os
import time
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt, jwk
from jose.utils import base64url_decode
from dotenv import load_dotenv
from models.user import TokenPayload

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_PROJECT_URL", "")
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
ALGORITHM_HS = "HS256"
ALGORITHM_ES = "ES256"

security = HTTPBearer()

# Cache the JWKS keys with TTL (1 hour)
_jwks_cache: dict | None = None
_jwks_cache_time: float = 0
JWKS_CACHE_TTL = 3600  # seconds


def _get_jwks(force_refresh: bool = False) -> dict:
    global _jwks_cache, _jwks_cache_time
    now = time.time()
    if force_refresh or _jwks_cache is None or (now - _jwks_cache_time) > JWKS_CACHE_TTL:
        resp = httpx.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", timeout=10)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_cache_time = now
    return _jwks_cache


def _decode_token(token: str) -> dict:
    """Decode a Supabase JWT, supporting both ES256 (new) and HS256 (legacy)."""
    # Read the token header to determine algorithm
    header = jwt.get_unverified_header(token)
    alg = header.get("alg", "")
    kid = header.get("kid", "")

    if alg == "ES256":
        # Use the public key from Supabase JWKS
        jwks = _get_jwks()
        matching_keys = [k for k in jwks.get("keys", []) if k.get("kid") == kid]
        if not matching_keys:
            # Key not found — try refreshing JWKS in case keys were rotated
            jwks = _get_jwks(force_refresh=True)
            matching_keys = [k for k in jwks.get("keys", []) if k.get("kid") == kid]
            if not matching_keys:
                raise JWTError("No matching key found in JWKS")
        key = matching_keys[0]
        try:
            return jwt.decode(
                token, key, algorithms=[ALGORITHM_ES], options={"verify_aud": False}
            )
        except JWTError:
            # Decode failed — try refreshing JWKS once before giving up
            jwks = _get_jwks(force_refresh=True)
            matching_keys = [k for k in jwks.get("keys", []) if k.get("kid") == kid]
            if not matching_keys:
                raise
            key = matching_keys[0]
            return jwt.decode(
                token, key, algorithms=[ALGORITHM_ES], options={"verify_aud": False}
            )
    else:
        # Fallback to HS256 with the JWT secret
        return jwt.decode(
            token, JWT_SECRET, algorithms=[ALGORITHM_HS], options={"verify_aud": False}
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenPayload:
    token = credentials.credentials
    try:
        payload = _decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
        return TokenPayload(
            sub=user_id,
            email=payload.get("email"),
            role=payload.get("role"),
            exp=payload.get("exp"),
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
        )


async def require_admin(
    current_user: TokenPayload = Depends(get_current_user),
) -> TokenPayload:
    from services.supabase_client import supabase
    import logging

    try:
        result = (
            supabase.table("users")
            .select("role")
            .eq("id", current_user.sub)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        if not rows:
            logging.warning(f"require_admin: No user row found for id={current_user.sub}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required — user profile not found",
            )
        role = rows[0].get("role", "")
        if role != "admin":
            logging.warning(f"require_admin: User {current_user.sub} has role='{role}', not admin")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
            )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"require_admin: DB query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify admin status: {str(e)}",
        )
    return current_user
