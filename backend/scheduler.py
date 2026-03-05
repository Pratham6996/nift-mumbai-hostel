from apscheduler.schedulers.background import BackgroundScheduler
from services.cleanup_service import delete_old_images, delete_orphaned_images
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def start_scheduler():
    scheduler.add_job(
        delete_old_images,
        trigger="cron",
        hour=2,
        minute=0,
        id="cleanup_old_images",
        replace_existing=True,
    )
    scheduler.add_job(
        delete_orphaned_images,
        trigger="cron",
        hour=3,
        minute=0,
        id="cleanup_orphaned_images",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started: daily cleanups at 2:00 AM and 3:00 AM")


def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped")
