import os
import httpx
from config.settings import get_settings

settings = get_settings()
TIKTOK_API = "https://open.tiktokapis.com/v2"


async def _get_access_token() -> str:
    """Refresh TikTok access token using the stored refresh token."""
    if not settings.tiktok_client_key or not settings.tiktok_refresh_token:
        raise ValueError("TIKTOK_CLIENT_KEY and TIKTOK_REFRESH_TOKEN must be set.")

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{TIKTOK_API}/oauth/token/",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "client_key": settings.tiktok_client_key,
                "client_secret": settings.tiktok_client_secret,
                "grant_type": "refresh_token",
                "refresh_token": settings.tiktok_refresh_token,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["data"]["access_token"]


async def upload_tiktok_video(
    video_path: str,
    caption: str,
    privacy: str = "PUBLIC_TO_EVERYONE",
) -> str:
    """
    Upload a video to TikTok via Content Posting API v2.
    File is uploaded in a single chunk (supports up to 4GB).
    Returns a status string with the publish_id.
    """
    access_token = await _get_access_token()
    video_size = os.path.getsize(video_path)

    async with httpx.AsyncClient(timeout=120) as client:
        # Step 1: Initialize upload
        init_resp = await client.post(
            f"{TIKTOK_API}/post/publish/video/init/",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json; charset=UTF-8",
            },
            json={
                "post_info": {
                    "title": caption[:2200],
                    "privacy_level": privacy,
                    "disable_duet": False,
                    "disable_comment": False,
                    "disable_stitch": False,
                },
                "source_info": {
                    "source": "FILE_UPLOAD",
                    "video_size": video_size,
                    "chunk_size": video_size,  # single chunk
                    "total_chunk_count": 1,
                },
            },
        )
        init_resp.raise_for_status()
        init_data = init_resp.json()["data"]
        publish_id = init_data["publish_id"]
        upload_url = init_data["upload_url"]

        # Step 2: Upload the video file
        with open(video_path, "rb") as f:
            video_bytes = f.read()

        upload_resp = await client.put(
            upload_url,
            content=video_bytes,
            headers={
                "Content-Type": "video/mp4",
                "Content-Range": f"bytes 0-{video_size - 1}/{video_size}",
            },
        )
        upload_resp.raise_for_status()

    return f"tiktok://publish_id/{publish_id}"
