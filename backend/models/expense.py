from enum import Enum
from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class ExpenseCategory(str, Enum):
    FOOD = "food"
    DRINK = "drink"
    SNACKS = "snacks"


class ExpenseCreate(BaseModel):
    item_name: str = Field(..., min_length=1, max_length=200)
    category: ExpenseCategory
    amount: float = Field(..., gt=0, le=100000)
    date: date


class ExpenseOut(BaseModel):
    id: str
    user_id: str
    item_name: str
    category: str
    amount: float
    date: date
    created_at: datetime


class MonthlySummary(BaseModel):
    month: str
    total: float
    by_category: dict
    count: int
