from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List


class MealItem(BaseModel):
    name: str
    type: Optional[str] = None


class DayMenu(BaseModel):
    breakfast: List[str] = []
    lunch: List[str] = []
    snacks: List[str] = []
    dinner: List[str] = []


class WeeklyMenuCreate(BaseModel):
    week_start_date: date
    monday: DayMenu
    tuesday: DayMenu
    wednesday: DayMenu
    thursday: DayMenu
    friday: DayMenu
    saturday: DayMenu
    sunday: DayMenu


class WeeklyMenuOut(BaseModel):
    id: str
    week_start_date: date
    monday: dict
    tuesday: dict
    wednesday: dict
    thursday: dict
    friday: dict
    saturday: dict
    sunday: dict
    created_at: datetime
