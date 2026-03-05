from datetime import datetime, timedelta, timezone
import logging
import uuid
from services.supabase_client import supabase
from services.storage_service import delete_image

logger = logging.getLogger(__name__)

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


def delete_orphaned_images():
    """Finds folders in storage that belong to deleted users and removes them."""
    try:
        # Get all folders (top level items) in the bucket
        folders_result = supabase.storage.from_(BUCKET_NAME).list()
        folders = [f["name"] for f in folders_result if f.get("name")]
        
        # Identify UUID-like folder names that correspond to user IDs
        user_ids = []
        for f in folders:
            try:
                uuid.UUID(f)
                user_ids.append(f)
            except ValueError:
                pass
        
        if not user_ids:
            return {"deleted_files": 0, "deleted_folders": 0, "orphaned_users": []}
            
        # Check which of these users still exist in the database
        result = supabase.table("users").select("id").in_("id", user_ids).execute()
        existing_users = {row["id"] for row in (result.data or [])}
        
        orphaned_users = set(user_ids) - existing_users
        
        deleted_count = 0
        deleted_folders = []
        
        for orphaned_user in orphaned_users:
            try:
                # List files in the orphaned folder
                files_result = supabase.storage.from_(BUCKET_NAME).list(orphaned_user)
                if files_result:
                    # Remove all files in that folder
                    paths_to_delete = [f"{orphaned_user}/{file['name']}" for file in files_result if file.get("name") and file["name"] != ".emptyFolderPlaceholder"]
                    if paths_to_delete:
                        supabase.storage.from_(BUCKET_NAME).remove(paths_to_delete)
                        deleted_count += len(paths_to_delete)
                
                # Also try to remove the folder placeholder itself if Supabase created one
                supabase.storage.from_(BUCKET_NAME).remove([f"{orphaned_user}/.emptyFolderPlaceholder"])
                
                deleted_folders.append(orphaned_user)
            except Exception as e:
                logger.error(f"Error cleaning up orphaned folder {orphaned_user}: {e}")
                
        return {"deleted_files": deleted_count, "deleted_folders": len(deleted_folders), "orphaned_users": deleted_folders}
    except Exception as e:
        logger.error(f"Error in delete_orphaned_images: {e}")
        return {"error": str(e)}
