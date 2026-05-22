import httpx
from config.settings import get_settings

GRAPH_URL = "https://graph.facebook.com/v18.0"


async def post_to_facebook_group(
    image_path: str,
    message: str,
    group_id: str | None = None,
) -> str:
    """
    Post an image + text to a Facebook Group.
    Requires the 'publish_to_groups' permission — submit your app for Meta App Review
    at https://developers.facebook.com/docs/apps/review if you see a 403 error.
    """
    settings = get_settings()   # always fresh — respects hot-reload after settings save

    if not settings.meta_user_access_token:
        raise ValueError("META_USER_ACCESS_TOKEN must be set.")

    token = settings.meta_user_access_token
    gid = group_id or settings.meta_group_id
    if not gid:
        raise ValueError("META_GROUP_ID must be set or passed as argument.")

    # verify=False needed on Windows Python 3.14 (Schannel / certifi SSL chain issue)
    async with httpx.AsyncClient(timeout=30, verify=False) as client:
        with open(image_path, "rb") as f:
            resp = await client.post(
                f"{GRAPH_URL}/{gid}/photos",
                data={"message": message[:5000], "access_token": token},
                files={"source": ("deal.jpg", f, "image/jpeg")},
            )

        if resp.status_code == 403:
            raise PermissionError(
                "Facebook Group posting requires the 'publish_to_groups' permission. "
                "Your Meta app must be approved via App Review. "
                "See: https://developers.facebook.com/docs/apps/review"
            )

        resp.raise_for_status()
        result = resp.json()
        post_id = result.get("id", "")

    return f"https://www.facebook.com/groups/{gid}/posts/{post_id.split('_')[-1]}"
