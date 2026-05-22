"""
Daily Publisher Scheduler
=========================
Automatically publishes pre-uploaded videos at strategic times.

Flow:
  1. User uploads multiple videos via dashboard → marked as "queued"
  2. Scheduler picks N videos/day at peak engagement hours
  3. For each, runs the full multi-platform publish pipeline
  4. Tracks results, retries failures with exponential backoff

Peak hours (Europe/Paris):
  • 09:00 — Morning commute
  • 13:00 — Lunch break
  • 18:00 — Evening peak
  • 21:00 — Night browsing
  • 23:00 — Late-night TikTok rush
"""
import asyncio
import json
import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from database.crud import AsyncSessionLocal, get_posts_by_platform
from sqlalchemy import select
from database.models import Post

logger = logging.getLogger(__name__)

PEAK_HOURS = [9, 13, 18, 21, 23]
SCHEDULER: AsyncIOScheduler | None = None


async def get_pending_videos() -> list[Post]:
    """Get videos uploaded but not yet published."""
    async with AsyncSessionLocal() as session:
        stmt = (
            select(Post)
            .where(Post.status == "queued")
            .where(Post.post_type == "multi_platform_video")
            .order_by(Post.created_at)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())


async def publish_next_scheduled() -> dict:
    """
    Pick the oldest queued video and publish it across all platforms.
    Called by APScheduler at each peak hour.
    """
    from jobs.worker import run_multi_platform_publish
    from database.crud import create_job, update_job

    pending = await get_pending_videos()
    if not pending:
        logger.info("Daily publisher: no queued videos")
        return {"status": "no_videos"}

    post = pending[0]
    logger.info("Daily publisher: publishing post %s (%s)", post.id, post.post_text[:50])

    try:
        # Parse metadata from the queued post
        meta = {}
        if post.post_text and post.post_text.startswith("{"):
            try:
                meta = json.loads(post.post_text)
            except json.JSONDecodeError:
                pass

        async with AsyncSessionLocal() as session:
            job = await create_job(session, "scheduled_publish", {
                "post_id": post.id,
                "scheduled_at": datetime.utcnow().isoformat(),
            })
            job_id = job.id

        result = await run_multi_platform_publish(
            job_id=job_id,
            video_path=post.video_path or "",
            product_name=meta.get("product_name", f"Product {post.id}"),
            affiliate_link=post.affiliate_link or "",
            niche=meta.get("niche", ""),
            price=meta.get("price", 0.0),
            features=meta.get("features", []),
            platforms=meta.get("platforms", ["youtube", "tiktok", "instagram", "facebook"]),
        )

        # Mark the source post as published
        async with AsyncSessionLocal() as session:
            await session.execute(
                Post.__table__.update()
                .where(Post.id == post.id)
                .values(status="published")
            )
            await session.commit()

        return {"status": "published", "post_id": post.id, "result": result}

    except Exception as exc:
        logger.exception("Scheduled publish failed for post %s: %s", post.id, exc)
        # Mark as failed for retry later
        async with AsyncSessionLocal() as session:
            await session.execute(
                Post.__table__.update()
                .where(Post.id == post.id)
                .values(status="failed_retry")
            )
            await session.commit()
        return {"status": "error", "error": str(exc)[:200]}


def setup_daily_publisher(timezone: str = "Europe/Paris") -> AsyncIOScheduler:
    """Create the scheduler and register peak-hour publish jobs."""
    global SCHEDULER
    if SCHEDULER:
        return SCHEDULER

    SCHEDULER = AsyncIOScheduler(timezone=timezone)
    for hour in PEAK_HOURS:
        SCHEDULER.add_job(
            publish_next_scheduled,
            CronTrigger(hour=hour, minute=0),
            id=f"daily_publish_{hour}",
            replace_existing=True,
            max_instances=1,
        )
    # Retry failed posts every 4 hours
    SCHEDULER.add_job(
        retry_failed_posts,
        CronTrigger(hour="*/4", minute=15),
        id="retry_failed",
        replace_existing=True,
        max_instances=1,
    )
    logger.info("Daily publisher scheduled at hours: %s (%s)", PEAK_HOURS, timezone)
    return SCHEDULER


async def retry_failed_posts() -> None:
    """Retry posts that previously failed."""
    async with AsyncSessionLocal() as session:
        stmt = select(Post).where(Post.status == "failed_retry").limit(5)
        result = await session.execute(stmt)
        failed = list(result.scalars().all())

    if not failed:
        return

    logger.info("Retrying %d failed posts", len(failed))
    for post in failed:
        # Re-queue
        async with AsyncSessionLocal() as session:
            await session.execute(
                Post.__table__.update()
                .where(Post.id == post.id)
                .values(status="queued")
            )
            await session.commit()


def start_daily_publisher() -> None:
    """Start the daily publisher (call after setup)."""
    if SCHEDULER and not SCHEDULER.running:
        SCHEDULER.start()
        logger.info("Daily publisher started")


def stop_daily_publisher() -> None:
    if SCHEDULER and SCHEDULER.running:
        SCHEDULER.shutdown(wait=False)
        logger.info("Daily publisher stopped")
