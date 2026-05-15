import httpx
from config.settings import get_settings

settings = get_settings()
GRAPH_URL = "https://graph.facebook.com/v18.0"


async def upload_facebook_page_video(
    video_path: str,
    description: str,
    title: str = "",
    video_url: str | None = None,
) -> str:
    """Upload video to a Facebook Page. Returns the video URL."""
    if not settings.meta_user_access_token or not settings.meta_page_id:
        raise ValueError("META_USER_ACCESS_TOKEN and META_PAGE_ID must be set.")

    token = settings.meta_user_access_token
    page_id = settings.meta_page_id

    async with httpx.AsyncClient(timeout=120) as client:
        if video_url:
            # Use URL-based upload (simpler, no multipart)
            resp = await client.post(
                f"{GRAPH_URL}/{page_id}/videos",
                params={
                    "file_url": video_url,
                    "description": description[:5000],
                    "title": title[:255],
                    "access_token": token,
                },
            )
        else:
            # Direct file upload
            with open(video_path, "rb") as f:
                resp = await client.post(
                    f"https://graph-video.facebook.com/v18.0/{page_id}/videos",
                    data={
                        "description": description[:5000],
                        "title": title[:255],
                        "access_token": token,
                    },
                    files={"source": ("video.mp4", f, "video/mp4")},
                )

        resp.raise_for_status()
        video_id = resp.json()["id"]

    return f"https://www.facebook.com/video/{video_id}"
