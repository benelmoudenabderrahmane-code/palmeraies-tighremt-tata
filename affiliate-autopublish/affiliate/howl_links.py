import httpx
from config.settings import get_settings

settings = get_settings()

# Known Howl API endpoints (try in order if one fails)
_HOWL_ENDPOINTS = [
    "https://api.planethowl.com/smartlinks",
    "https://api.howl.link/smartlinks",
]


async def create_howl_link(product_url: str) -> str | None:
    """Create a monetized howl.me short link. Returns None if no API key or request fails."""
    if not settings.howl_api_key:
        return None

    headers = {
        "Authorization": f"Bearer {settings.howl_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        for endpoint in _HOWL_ENDPOINTS:
            try:
                resp = await client.post(endpoint, headers=headers, json={"url": product_url})
                if resp.status_code in (200, 201):
                    data = resp.json()
                    link = (
                        data.get("howl_link_url")
                        or data.get("url")
                        or data.get("short_url")
                        or data.get("link")
                    )
                    if link:
                        return link
            except httpx.RequestError:
                continue

    return None
