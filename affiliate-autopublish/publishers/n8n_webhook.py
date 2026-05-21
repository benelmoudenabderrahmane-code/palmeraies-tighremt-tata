"""
n8n Publishing Webhook
======================
Sends a ready post to n8n for platform publishing.
n8n handles the OAuth + platform API calls (YouTube, TikTok, Instagram).

Payload sent to n8n:
{
    "post_id":       int,
    "post_type":     "video" | "deal_post",
    "platforms":     ["youtube", "tiktok", "instagram"],
    "caption":       "...",
    "affiliate_link":"https://...",
    "product_name":  "...",
    "video_url":     "http://localhost:8000/media/..." | null,
    "image_url":     "http://localhost:8000/media/..." | null,
    "callback_url":  "http://localhost:8000/api/posts/{id}/published"
}
"""
import logging
import httpx
from config.settings import get_settings

logger = logging.getLogger(__name__)


def _media_url(path: str | None, base_url: str) -> str | None:
    """Convert a local file path to a publicly accessible URL via our FastAPI /media/ route."""
    if not path:
        return None
    # Normalise Windows backslashes and strip leading ./
    clean = path.replace("\\", "/").lstrip("./")
    return f"{base_url}/{clean}"


async def send_to_n8n(
    post_id: int,
    post_type: str,
    platforms: list[str],
    caption: str,
    affiliate_link: str,
    product_name: str,
    video_path: str | None = None,
    image_path: str | None = None,
    youtube_tags: list[str] | None = None,
    youtube_description: str | None = None,
) -> bool:
    """
    Fire-and-forget webhook to n8n.
    Returns True if n8n acknowledged (2xx), False otherwise.
    Silently skips if N8N_WEBHOOK_URL is not configured.
    """
    settings = get_settings()
    webhook_url = settings.n8n_webhook_url.strip()

    if not webhook_url:
        logger.debug("n8n webhook not configured — skipping")
        return False

    base = settings.base_url.rstrip("/")
    payload = {
        "post_id":             post_id,
        "post_type":           post_type,
        "platforms":           platforms,
        "caption":             caption,
        "affiliate_link":      affiliate_link,
        "product_name":        product_name,        # SEO-optimized title for YouTube
        "video_url":           _media_url(video_path, base),
        "image_url":           _media_url(image_path, base),
        "callback_url":        f"{base}/api/n8n/published/{post_id}",
        "youtube_tags":        youtube_tags or [],
        "youtube_description": youtube_description or caption,
    }

    try:
        async with httpx.AsyncClient(timeout=10, verify=False) as client:
            resp = await client.post(webhook_url, json=payload)
            if resp.status_code < 300:
                logger.info("n8n webhook sent OK for post %s → platforms %s", post_id, platforms)
                return True
            else:
                logger.warning("n8n webhook returned %s: %s", resp.status_code, resp.text[:200])
                return False
    except httpx.RequestError as exc:
        logger.warning("n8n webhook unreachable: %s", exc)
        return False
