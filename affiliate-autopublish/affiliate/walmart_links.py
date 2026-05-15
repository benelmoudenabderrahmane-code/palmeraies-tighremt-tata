from urllib.parse import quote
import httpx
from config.settings import get_settings

settings = get_settings()


async def create_walmart_link(product_url: str) -> str | None:
    """Create a tracking link via Impact Radius API, with a basic fallback."""
    if settings.impact_account_sid and settings.impact_auth_token and settings.walmart_campaign_id:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"https://api.impact.com/Mediapartners/{settings.impact_account_sid}/TrackingLinks",
                    auth=(settings.impact_account_sid, settings.impact_auth_token),
                    json={
                        "CampaignId": settings.walmart_campaign_id,
                        "Uri": product_url,
                        "TrackingLinkName": product_url[:80],
                    },
                )
                if resp.status_code in (200, 201):
                    data = resp.json()
                    tracking_url = data.get("ClickTrackingUri") or data.get("Url") or data.get("url")
                    if tracking_url:
                        return tracking_url
        except httpx.RequestError:
            pass

    # Fallback: construct goto.walmart.com deep link
    if settings.impact_account_sid and settings.walmart_campaign_id:
        encoded = quote(product_url, safe="")
        return (
            f"https://goto.walmart.com/c/"
            f"{settings.impact_account_sid}/{settings.walmart_campaign_id}?u={encoded}"
        )

    return None
