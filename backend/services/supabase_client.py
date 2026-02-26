import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_PROJECT_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError("Supabase credentials not configured. Set SUPABASE_PROJECT_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


supabase: Client = get_supabase_client() if SUPABASE_URL and SUPABASE_SERVICE_KEY else None
