from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from models.menu import WeeklyMenuCreate, WeeklyMenuOut
from models.user import TokenPayload
from auth_middleware import require_admin
from services import menu_service

router = APIRouter(prefix="/api", tags=["Menu"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/menu")
@limiter.limit("30/minute")
def get_current_menu(request: Request):
    menu = menu_service.get_current_menu()
    if not menu:
        return {"message": "No menu available"}
    return menu


@router.get("/menu/{week_start_date}")
@limiter.limit("30/minute")
def get_menu_by_date(request: Request, week_start_date: str):
    menu = menu_service.get_menu_by_date(week_start_date)
    if not menu:
        return {"message": "No menu found for this week"}
    return menu


@router.post("/admin/menu")
@limiter.limit("5/minute")
def upload_menu(request: Request, menu: WeeklyMenuCreate, admin: TokenPayload = Depends(require_admin)):
    return menu_service.create_menu(menu)
