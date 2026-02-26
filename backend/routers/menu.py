from fastapi import APIRouter, Depends
from models.menu import WeeklyMenuCreate, WeeklyMenuOut
from models.user import TokenPayload
from auth_middleware import require_admin
from services import menu_service

router = APIRouter(prefix="/api", tags=["Menu"])


@router.get("/menu")
def get_current_menu():
    menu = menu_service.get_current_menu()
    if not menu:
        return {"message": "No menu available"}
    return menu


@router.get("/menu/{week_start_date}")
def get_menu_by_date(week_start_date: str):
    menu = menu_service.get_menu_by_date(week_start_date)
    if not menu:
        return {"message": "No menu found for this week"}
    return menu


@router.post("/admin/menu")
def upload_menu(menu: WeeklyMenuCreate, admin: TokenPayload = Depends(require_admin)):
    return menu_service.create_menu(menu)
