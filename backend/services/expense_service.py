from services.supabase_client import supabase
from models.expense import ExpenseCreate
from fastapi import HTTPException
from collections import defaultdict


def create_expense(user_id: str, expense: ExpenseCreate):
    data = {
        "user_id": user_id,
        "item_name": expense.item_name,
        "category": expense.category.value,
        "amount": expense.amount,
        "date": str(expense.date),
    }
    result = supabase.table("expenses").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create expense")
    return result.data[0]


def get_user_expenses(user_id: str, month: str = None, limit: int = 100, offset: int = 0):
    query = supabase.table("expenses").select("*").eq("user_id", user_id).order("date", desc=True)
    if month:
        query = query.gte("date", f"{month}-01").lt("date", f"{month}-32")
    result = query.range(offset, offset + limit - 1).execute()
    return result.data or []


def get_monthly_summary(user_id: str, month: str):
    expenses = get_user_expenses(user_id, month=month, limit=1000)
    total = sum(e["amount"] for e in expenses)
    by_category = defaultdict(float)
    for e in expenses:
        by_category[e["category"]] += e["amount"]
    return {
        "month": month,
        "total": round(total, 2),
        "by_category": dict(by_category),
        "count": len(expenses),
    }


def delete_expense(expense_id: str, user_id: str):
    existing = supabase.table("expenses").select("*").eq("id", expense_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    if existing.data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own expenses")
    supabase.table("expenses").delete().eq("id", expense_id).execute()
    return existing.data
