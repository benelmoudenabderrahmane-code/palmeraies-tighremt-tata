"""
Dashboard Metrics & Analytics
=============================
Aggregated metrics for the dashboard analytics tab.

Tracks:
  • Total clicks per affiliate network (Howl/Amazon/Walmart)
  • Top performing products (clicks per product)
  • Platform performance (which platform converts best)
  • Daily/weekly/monthly trends
  • Click-through rate (CTR) estimates
"""
import logging
from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy import select, func, and_

from database.crud import AsyncSessionLocal
from database.models import Click, Post

logger = logging.getLogger(__name__)


async def get_overview() -> dict:
    """
    Return top-level KPIs for the dashboard hero stats.

    Returns:
    {
      "total_posts": int,
      "total_clicks": int,
      "posts_today": int,
      "clicks_today": int,
      "active_platforms": [str, ...],
      "top_product": {"name": ..., "clicks": ...}
    }
    """
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    async with AsyncSessionLocal() as session:
        # Total counts
        total_posts = (await session.execute(select(func.count(Post.id)))).scalar() or 0
        total_clicks = (await session.execute(select(func.count(Click.id)))).scalar() or 0

        # Today's activity
        posts_today = (await session.execute(
            select(func.count(Post.id)).where(Post.created_at >= today_start)
        )).scalar() or 0

        clicks_today = (await session.execute(
            select(func.count(Click.id)).where(Click.clicked_at >= today_start)
        )).scalar() or 0

        # Active platforms (posts in last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        platforms_result = await session.execute(
            select(Post.platform, func.count(Post.id))
            .where(Post.created_at >= week_ago)
            .group_by(Post.platform)
        )
        active_platforms = [row[0] for row in platforms_result.all() if row[0]]

        # Top product (by clicks via affiliate_link)
        # Join Click → Post via affiliate link match
        top_product_result = await session.execute(
            select(Post.post_text, func.count(Post.id).label("ct"))
            .where(Post.status == "published")
            .group_by(Post.post_text)
            .order_by(func.count(Post.id).desc())
            .limit(1)
        )
        top_row = top_product_result.first()
        top_product = {"name": top_row[0][:60] if top_row else "—", "count": top_row[1] if top_row else 0}

    return {
        "total_posts": total_posts,
        "total_clicks": total_clicks,
        "posts_today": posts_today,
        "clicks_today": clicks_today,
        "active_platforms": active_platforms,
        "top_product": top_product,
    }


async def get_platform_breakdown(days: int = 7) -> dict:
    """
    Breakdown of posts and success/failure per platform over the last N days.

    Returns:
    {
      "youtube":   {"published": 14, "failed": 1, "success_rate": 93.3},
      "tiktok":    {...},
      ...
    }
    """
    since = datetime.utcnow() - timedelta(days=days)

    async with AsyncSessionLocal() as session:
        rows = await session.execute(
            select(Post.platform, Post.status, func.count(Post.id))
            .where(Post.created_at >= since)
            .group_by(Post.platform, Post.status)
        )
        data = rows.all()

    breakdown: dict[str, dict] = defaultdict(lambda: {"published": 0, "failed": 0, "queued": 0, "ready": 0})
    for platform, status, count in data:
        if not platform:
            continue
        bucket = "published" if status == "published" else (
            "failed" if status in ("failed", "failed_retry") else status or "ready"
        )
        breakdown[platform][bucket] = breakdown[platform].get(bucket, 0) + count

    # Compute success rate per platform
    for platform, stats in breakdown.items():
        total = stats["published"] + stats["failed"]
        stats["total"] = total
        stats["success_rate"] = round(stats["published"] / total * 100, 1) if total > 0 else 0.0

    return dict(breakdown)


async def get_clicks_timeline(days: int = 30) -> list[dict]:
    """Daily clicks for the last N days (for chart rendering)."""
    since = datetime.utcnow() - timedelta(days=days)

    async with AsyncSessionLocal() as session:
        rows = await session.execute(
            select(
                func.date(Click.clicked_at).label("d"),
                func.count(Click.id).label("c"),
            )
            .where(Click.clicked_at >= since)
            .group_by(func.date(Click.clicked_at))
            .order_by("d")
        )
        return [{"date": str(row[0]), "clicks": row[1]} for row in rows.all()]


async def get_top_products(limit: int = 10) -> list[dict]:
    """Top N products by clicks across all networks."""
    async with AsyncSessionLocal() as session:
        # Group clicks by affiliate network and count
        # Since clicks store affiliate_url, group by that
        rows = await session.execute(
            select(
                Click.network,
                Click.affiliate_url,
                func.count(Click.id).label("clicks"),
            )
            .group_by(Click.network, Click.affiliate_url)
            .order_by(func.count(Click.id).desc())
            .limit(limit)
        )
        results = []
        for network, url, clicks in rows.all():
            results.append({
                "network": network or "unknown",
                "affiliate_url": (url or "")[:120],
                "clicks": clicks,
            })
        return results


async def get_publish_queue_status() -> dict:
    """Current state of the publish queue for the daily scheduler."""
    async with AsyncSessionLocal() as session:
        rows = await session.execute(
            select(Post.status, func.count(Post.id))
            .where(Post.post_type == "multi_platform_video")
            .group_by(Post.status)
        )
        breakdown = {row[0]: row[1] for row in rows.all()}

    return {
        "queued": breakdown.get("queued", 0),
        "ready": breakdown.get("ready", 0),
        "published": breakdown.get("published", 0),
        "failed": breakdown.get("failed", 0) + breakdown.get("failed_retry", 0),
    }
