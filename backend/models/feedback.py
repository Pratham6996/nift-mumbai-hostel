from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class FeedbackCategory(str, Enum):
    QUALITY = "quality"
    QUANTITY = "quantity"
    HYGIENE = "hygiene"
    SUGGESTION = "suggestion"


class FeedbackCreate(BaseModel):
    category: FeedbackCategory
    content: str = Field(..., min_length=10, max_length=2000)
    is_anonymous: bool = False


class FeedbackUpdate(BaseModel):
    category: Optional[FeedbackCategory] = None
    content: Optional[str] = Field(None, min_length=10, max_length=2000)


class FeedbackOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    category: str
    content: str
    image_url: Optional[str] = None
    is_anonymous: bool
    upvotes: int
    created_at: datetime
    updated_at: Optional[datetime] = None
