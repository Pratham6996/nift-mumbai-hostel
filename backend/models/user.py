from enum import Enum
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"


class UserOut(BaseModel):
    id: str
    email: str
    role: UserRole
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr


class TokenPayload(BaseModel):
    sub: str
    email: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
