import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from config.settings import get_settings

settings = get_settings()


def _get_youtube_service():
    creds = Credentials(
        token=None,
        refresh_token=settings.youtube_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.youtube_client_id,
        client_secret=settings.youtube_client_secret,
        scopes=["https://www.googleapis.com/auth/youtube.upload"],
    )
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


async def upload_youtube_video(
    video_path: str,
    title: str,
    description: str,
    tags: list[str],
    thumbnail_path: str | None = None,
    privacy: str = "public",
) -> str:
    """Upload video to YouTube. Returns the watch URL."""
    if not settings.youtube_refresh_token:
        raise ValueError("YOUTUBE_REFRESH_TOKEN not configured. Run auth/setup_auth.py first.")

    youtube = _get_youtube_service()

    body = {
        "snippet": {
            "title": title[:100],
            "description": description[:5000],
            "tags": tags[:30],
            "categoryId": "26",  # How-to & Style
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(video_path, chunksize=-1, resumable=True, mimetype="video/mp4")
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        _, response = request.next_chunk()

    video_id = response["id"]

    if thumbnail_path and os.path.exists(thumbnail_path):
        try:
            youtube.thumbnails().set(
                videoId=video_id,
                media_body=MediaFileUpload(thumbnail_path),
            ).execute()
        except Exception:
            pass  # Thumbnail upload is non-critical

    return f"https://www.youtube.com/watch?v={video_id}"
