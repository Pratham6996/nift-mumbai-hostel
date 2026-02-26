from services.supabase_client import supabase
from models.menu import WeeklyMenuCreate
from fastapi import HTTPException


def get_current_menu():
    result = supabase.table("weekly_menus").select("*").order("week_start_date", desc=True).limit(1).execute()
    if not result.data:
        return None
    return result.data[0]


def get_menu_by_date(week_start_date: str):
    result = supabase.table("weekly_menus").select("*").eq("week_start_date", week_start_date).single().execute()
    return result.data


def create_menu(menu: WeeklyMenuCreate):
    existing = supabase.table("weekly_menus").select("id").eq("week_start_date", str(menu.week_start_date)).execute()
    if existing.data:
        return update_menu(existing.data[0]["id"], menu)

    data = {
        "week_start_date": str(menu.week_start_date),
        "monday": menu.monday.model_dump(),
        "tuesday": menu.tuesday.model_dump(),
        "wednesday": menu.wednesday.model_dump(),
        "thursday": menu.thursday.model_dump(),
        "friday": menu.friday.model_dump(),
        "saturday": menu.saturday.model_dump(),
        "sunday": menu.sunday.model_dump(),
    }
    result = supabase.table("weekly_menus").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create menu")
    return result.data[0]


def update_menu(menu_id: str, menu: WeeklyMenuCreate):
    data = {
        "week_start_date": str(menu.week_start_date),
        "monday": menu.monday.model_dump(),
        "tuesday": menu.tuesday.model_dump(),
        "wednesday": menu.wednesday.model_dump(),
        "thursday": menu.thursday.model_dump(),
        "friday": menu.friday.model_dump(),
        "saturday": menu.saturday.model_dump(),
        "sunday": menu.sunday.model_dump(),
    }
    result = supabase.table("weekly_menus").update(data).eq("id", menu_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update menu")
    return result.data[0]
