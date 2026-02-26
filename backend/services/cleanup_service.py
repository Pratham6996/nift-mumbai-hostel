from datetime import datetime, timedelta, timezone
from services.supabase_client import supabase
from services.storage_service import delete_image

RETENTION_DAYS = 30
BUCKET_NAME = "feedback-images"


def delete_old_images():
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    cutoff_str = cutoff.isoformat()

    result = (
        supabase.table("feedback")
        .select("id, image_url, created_at")
        .not_.is_("image_url", "null")
        .lt("created_at", cutoff_str)
        .execute()
    )

    deleted_count = 0
    for record in result.data or []:
        image_url = record.get("image_url")
        if image_url:
            delete_image(image_url)
            supabase.table("feedback").update({"image_url": None}).eq("id", record["id"]).execute()
            deleted_count += 1

    return {"deleted": deleted_count, "cutoff_date": cutoff_str}
