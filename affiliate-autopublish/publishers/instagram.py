import asyncio
import httpx
from config.settings import get_settings

settings = get_settings()
GRAPH_URL = "https://graph.facebook.com/v18.0"


async def upload_instagram_reel(
    video_path: str,
    caption: str,
    video_url: str | None = None,
) -> str:
    """
    Upload a Reel to Instagram via Meta Graph API.
    video_url must be a publicly accessible HTTPS URL pointing to the MP4.
    (Host locally with ngrok during dev, or upload to cloud storage in production.)
    """
    if not settings.meta_user_access_token or not settings.meta_instagram_account_id:
        raise ValueError("META_USER_ACCESS_TOKEN and META_INSTAGRAM_ACCOUNT_ID must be set.")
    if not video_url:
        raise ValueError(
            "Instagram Reels require a publicly accessible video URL. "
            "Upload the video to a cloud bucket and pass its URL."
        )

    token = settings.meta_user_access_token
    ig_id = settings.meta_instagram_account_id

    async with httpx.AsyncClient(timeout=60) as client:
        # Step 1: Create media container
        resp = await client.post(
            f"{GRAPH_URL}/{ig_id}/media",
            params={
                "media_type": "REELS",
                "video_url": video_url,
                "caption": caption[:2200],
                "access_token": token,
            },
        )
        resp.raise_for_status()
        container_id = resp.json()["id"]

        # Step 2: Poll until the container is FINISHED processing
        for _ in range(30):
            await asyncio.sleep(10)
            status_resp = await client.get(
                f"{GRAPH_URL}/{container_id}",
                params={"fields": "status_code,status", "access_token": token},
            )
            status_data = status_resp.json()
            if status_data.get("status_code") == "FINISHED":
                break
            if status_data.get("status_code") == "ERROR":
                raise RuntimeError(f"Instagram container error: {status_data}")

        # Step 3: Publish
        pub_resp = await client.post(
            f"{GRAPH_URL}/{ig_id}/media_publish",
            params={"creation_id": container_id, "access_token": token},
        )
        pub_resp.raise_for_status()
        media_id = pub_resp.json()["id"]

    return f"https://www.instagram.com/p/{media_id}/"
