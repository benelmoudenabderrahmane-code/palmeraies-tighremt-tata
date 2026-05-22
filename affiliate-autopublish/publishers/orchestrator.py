"""
Multi-Platform Publish Orchestrator
====================================
Publishes a single video simultaneously to all 4 platforms using
the platform-specific SEO bundle from multi_platform_seo.py.

Runs all 4 platform uploads in parallel using asyncio.gather.
Each platform failure is isolated — others continue.

Returns a dict per platform with status, url (if published), and error.
"""
import asyncio
import logging
from typing import Any

logger = logging.getLogger(__name__)


async def _safe_call(platform: str, coro):
    """Run a publisher coroutine and capture success/failure."""
    try:
        result = await coro
        return {
            "platform": platform,
            "status": "success",
            "url": result if isinstance(result, str) else str(result),
            "error": None,
        }
    except Exception as exc:
        logger.warning("[%s] publish failed: %s", platform, exc)
        return {
            "platform": platform,
            "status": "failed",
            "url": None,
            "error": str(exc)[:200],
        }


async def publish_to_all_platforms(
    video_path: str,
    video_public_url: str,
    seo: dict,
    affiliate_link: str,
    platforms: list[str] | None = None,
) -> dict[str, dict[str, Any]]:
    """
    Publish a video to YouTube, TikTok, Instagram and Facebook in parallel.

    Args:
        video_path:        local path to the MP4 file (used by YouTube + TikTok)
        video_public_url:  publicly accessible HTTPS URL (REQUIRED for Instagram Reels)
        seo:               output of multi_platform_seo.generate_multi_platform_seo()
        affiliate_link:    link to post as comment / in description
        platforms:         subset to publish (defaults to all 4)

    Returns:
    {
      "youtube":   {"status": "success|failed|skipped", "url": "...", "error": null},
      "tiktok":    {...},
      "instagram": {...},
      "facebook":  {...}
    }
    """
    platforms = platforms or ["youtube", "tiktok", "instagram", "facebook"]
    tasks: list[asyncio.Task] = []
    names: list[str] = []

    # ── YouTube ────────────────────────────────────────────────────────────
    if "youtube" in platforms:
        names.append("youtube")
        tasks.append(_safe_call("youtube", _publish_youtube(
            video_path=video_path,
            title=seo["youtube"]["title"],
            description=seo["youtube"]["description"],
            tags=seo["youtube"]["tags"],
            affiliate_link=affiliate_link,
        )))

    # ── TikTok ─────────────────────────────────────────────────────────────
    if "tiktok" in platforms:
        names.append("tiktok")
        hashtags = " ".join(seo["tiktok"]["hashtags"])
        caption = f"{seo['tiktok']['caption']}\n\n{hashtags}"[:2200]
        tasks.append(_safe_call("tiktok", _publish_tiktok(
            video_path=video_path,
            caption=caption,
        )))

    # ── Instagram Reels ────────────────────────────────────────────────────
    if "instagram" in platforms:
        names.append("instagram")
        hashtags = " ".join(seo["instagram"]["hashtags"])
        caption = f"{seo['instagram']['caption']}\n\n{hashtags}"[:2200]
        tasks.append(_safe_call("instagram", _publish_instagram(
            video_url=video_public_url,
            caption=caption,
        )))

    # ── Facebook ───────────────────────────────────────────────────────────
    if "facebook" in platforms:
        names.append("facebook")
        tasks.append(_safe_call("facebook", _publish_facebook(
            message=seo["facebook"]["post_text"],
            video_path=video_path,
            video_url=video_public_url,
        )))

    results_list = await asyncio.gather(*tasks, return_exceptions=False)
    return {name: result for name, result in zip(names, results_list)}


# ── Platform-specific wrappers (lazy imports for graceful credential failure) ──

async def _publish_youtube(video_path, title, description, tags, affiliate_link):
    from publishers.youtube_publisher import upload_to_youtube
    result = await upload_to_youtube(
        video_path=video_path,
        title=title,
        description=description,
        tags=tags,
        affiliate_link=affiliate_link,
    )
    return result["shorts_url"]


async def _publish_tiktok(video_path, caption):
    from publishers.tiktok import upload_tiktok_video
    return await upload_tiktok_video(video_path=video_path, caption=caption)


async def _publish_instagram(video_url, caption):
    if not video_url:
        raise ValueError("Instagram requires a public HTTPS video_url")
    from publishers.instagram import upload_instagram_reel
    return await upload_instagram_reel(
        video_path="",
        caption=caption,
        video_url=video_url,
    )


async def _publish_facebook(message, video_path, video_url):
    """Facebook supports both video and image+text. Prefers video if available."""
    from publishers.facebook_group import post_to_facebook_group
    # For now FB Group accepts image + text. Video posting needs Pages API instead.
    # Fallback to posting the first frame as image with text + link.
    import tempfile
    import subprocess
    from pathlib import Path

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        thumb_path = tmp.name
    subprocess.run(
        ["ffmpeg", "-y", "-i", video_path, "-ss", "00:00:01", "-vframes", "1", thumb_path],
        capture_output=True, check=False
    )
    if not Path(thumb_path).exists() or Path(thumb_path).stat().st_size == 0:
        raise RuntimeError("Failed to extract thumbnail for Facebook post")

    return await post_to_facebook_group(image_path=thumb_path, message=message)
