from sqlalchemy.ext.asyncio import AsyncSession

from affiliate.amazon_links import make_affiliate_link
from affiliate.walmart_links import create_walmart_link
from affiliate.howl_links import create_howl_link
from affiliate.mavely_links import get_mavely_link
from database.crud import create_affiliate_link
from config.settings import get_settings

settings = get_settings()


async def generate_affiliate_link(
    session: AsyncSession,
    product_id: int,
    product_url: str,
    network: str,
    custom_link: str | None = None,
) -> str:
    """
    Generate and persist an affiliate link for the given network.
    Returns the local /go/{short_id} redirect URL for click tracking.
    """
    affiliate_url: str | None = None

    if network == "amazon":
        if settings.amazon_associate_tag:
            affiliate_url = make_affiliate_link(product_url, settings.amazon_associate_tag)

    elif network == "walmart":
        affiliate_url = await create_walmart_link(product_url)

    elif network == "howl":
        affiliate_url = await create_howl_link(product_url)

    elif network == "mavely":
        affiliate_url = get_mavely_link(custom_link)

    elif network == "custom":
        affiliate_url = custom_link

    # Final fallback: use the raw product URL so the system never breaks
    if not affiliate_url:
        affiliate_url = custom_link or product_url

    link = await create_affiliate_link(
        session,
        product_id=product_id,
        network=network,
        original_url=product_url,
        affiliate_link=affiliate_url,
    )
    return f"{settings.base_url}/go/{link.short_redirect_id}"
