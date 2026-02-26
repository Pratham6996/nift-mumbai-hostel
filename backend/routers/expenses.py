from fastapi import APIRouter, Depends, Query
from typing import Optional
from models.expense import ExpenseCreate
from models.user import TokenPayload
from auth_middleware import get_current_user
from services import expense_service

router = APIRouter(prefix="/api", tags=["Expenses"])


@router.post("/expenses")
def create_expense(
    expense: ExpenseCreate,
    current_user: TokenPayload = Depends(get_current_user),
):
    return expense_service.create_expense(current_user.sub, expense)


@router.get("/expenses")
def get_expenses(
    month: Optional[str] = Query(default=None, description="YYYY-MM format"),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    current_user: TokenPayload = Depends(get_current_user),
):
    return expense_service.get_user_expenses(current_user.sub, month=month, limit=limit, offset=offset)


@router.get("/expenses/summary")
def get_monthly_summary(
    month: str = Query(..., description="YYYY-MM format"),
    current_user: TokenPayload = Depends(get_current_user),
):
    return expense_service.get_monthly_summary(current_user.sub, month)


@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: str,
    current_user: TokenPayload = Depends(get_current_user),
):
    return expense_service.delete_expense(expense_id, current_user.sub)
