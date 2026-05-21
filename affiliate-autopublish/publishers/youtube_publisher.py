"""
YouTube Direct Publisher
========================
Uploads videos directly to YouTube via OAuth2 + requests.
No n8n, no SSL issues, fully automated.

Token file: youtube_token.pickle (created once via setup_youtube_auth.py)
"""
import asyncio
import json
import logging
import os
import pickle
import ssl
import time
from pathlib import Path

import requests
import urllib3

# Disable SSL verification (corporate proxy / antivirus)
ssl._create_default_https_context = ssl._create_unverified_context
urllib3.disable_warnings()
from requests.adapters import HTTPAdapter
_orig_send = HTTPAdapter.send
def _no_ssl(self, *a, **kw):
    kw["verify"] = False
    return _orig_send(self, *a, **kw)
HTTPAdapter.send = _no_ssl

from google.auth.transport.requests import Request

logger = logging.getLogger(__name__)

TOKEN_FILE = Path(__file__).parent.parent / "youtube_token.pickle"
REDIRECT_BASE = "https://nike-redirect.vercel.app"  # updates per upload


def _load_credentials():
    if not TOKEN_FILE.exists():
        raise FileNotFoundError(
            f"youtube_token.pickle not found at {TOKEN_FILE}. "
            "Run: python upload_youtube.py once to authenticate."
        )
    with open(TOKEN_FILE, "rb") as f:
        creds = pickle.load(f)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_FILE, "wb") as f:
            pickle.dump(creds, f)
    return creds


def _get_token() -> str:
    creds = _load_credentials()
    return creds.token


async def upload_to_youtube(
    video_path: str,
    title: str,
    description: str,
    tags: list[str] | None = None,
    affiliate_link: str = "",
    privacy: str = "public",
) -> dict:
    """
    Upload video to YouTube Shorts.
    Returns {"video_id": "...", "url": "...", "shorts_url": "..."}
    """
    return await asyncio.to_thread(
        _upload_sync, video_path, title, description, tags or [], affiliate_link, privacy
    )


def _upload_sync(video_path, title, description, tags, affiliate_link, privacy) -> dict:
    token = _get_token()
    headers_auth = {"Authorization": f"Bearer {token}"}
    file_size = Path(video_path).stat().st_size

    logger.info("YouTube upload starting: %s (%.1f MB)", Path(video_path).name, file_size / 1024 / 1024)

    # Build metadata
    metadata = {
        "snippet": {
            "title": (title + " #Shorts")[:100] if "#Shorts" not in title else title[:100],
            "description": description,
            "tags": tags + ["Shorts"] if "Shorts" not in tags else tags,
            "categoryId": "22",
            "defaultLanguage": "fr",
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    # 1. Init resumable upload
    init_resp = requests.post(
        "https://www.googleapis.com/upload/youtube/v3/videos"
        "?uploadType=resumable&part=snippet,status",
        headers={
            **headers_auth,
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Type": "video/mp4",
            "X-Upload-Content-Length": str(file_size),
        },
        data=json.dumps(metadata, ensure_ascii=True),
        verify=False,
    )
    init_resp.raise_for_status()
    upload_url = init_resp.headers["Location"]

    # 2. Upload in 4MB chunks
    chunk_size = 4 * 1024 * 1024
    uploaded = 0
    video_id = None

    with open(video_path, "rb") as f:
        while uploaded < file_size:
            chunk = f.read(chunk_size)
            end = uploaded + len(chunk) - 1
            resp = requests.put(
                upload_url,
                headers={
                    "Content-Length": str(len(chunk)),
                    "Content-Range": f"bytes {uploaded}-{end}/{file_size}",
                },
                data=chunk,
                verify=False,
            )
            uploaded += len(chunk)
            pct = int(uploaded / file_size * 100)
            logger.info("Upload progress: %d%%", pct)

            if resp.status_code in (200, 201):
                video_id = resp.json()["id"]
                break
            elif resp.status_code == 308:
                continue
            else:
                raise RuntimeError(f"Upload error {resp.status_code}: {resp.text[:200]}")

    if not video_id:
        raise RuntimeError("Upload completed but no video ID returned")

    logger.info("Video uploaded: %s", video_id)

    # 3. Post affiliate link as comment
    if affiliate_link:
        time.sleep(3)
        _post_comment(token, video_id, affiliate_link)

    return {
        "video_id": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "shorts_url": f"https://www.youtube.com/shorts/{video_id}",
    }


def _post_comment(token: str, video_id: str, affiliate_link: str):
    """Post affiliate link as first comment."""
    try:
        resp = requests.post(
            "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            data=json.dumps({
                "snippet": {
                    "videoId": video_id,
                    "topLevelComment": {
                        "snippet": {"textOriginal": affiliate_link}
                    },
                }
            }),
            verify=False,
        )
        if resp.status_code == 200:
            logger.info("Comment posted: %s", affiliate_link)
        else:
            logger.warning("Comment failed: %s", resp.status_code)
    except Exception as exc:
        logger.warning("Comment error: %s", exc)
