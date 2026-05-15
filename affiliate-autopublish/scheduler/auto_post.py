from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select

from database.crud import AsyncSessionLocal
from database.models import Post

scheduler = AsyncIOScheduler(timezone="UTC")


async def _auto_post_job():
    """Pick the oldest ready deal post and publish it to Facebook Group."""
    from publishers.facebook_group import post_to_facebook_group

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Post)
            .where(Post.status == "ready", Post.platform == "facebook_group")
            .order_by(Post.created_at)
            .limit(1)
        )
        post = result.scalar_one_or_none()
        if not post:
            return

        try:
            url = await post_to_facebook_group(post.image_path, post.post_text)
            post.status = "published"
            post.platform_post_id = url
            post.published_at = datetime.utcnow()
        except Exception as exc:
            post.status = "failed"
            # Keep the error message in case of retry
            post.post_text = f"[FAILED: {exc}]\n\n{post.post_text}"

        await session.commit()


def setup_scheduler(posts_per_day: int = 3, hours: list[int] | None = None) -> None:
    """Configure recurring auto-post jobs. Call this at startup and when settings change."""
    if hours is None:
        hours = [9, 13, 18]

    scheduler.remove_all_jobs()
    for h in hours[:posts_per_day]:
        scheduler.add_job(
            _auto_post_job,
            CronTrigger(hour=h, minute=0),
            id=f"auto_post_{h}",
            replace_existing=True,
            misfire_grace_time=600,
        )


def start_scheduler() -> None:
    if not scheduler.running:
        scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
