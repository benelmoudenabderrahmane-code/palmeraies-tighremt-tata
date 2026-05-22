from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from affiliate.amazon_links import make_affiliate_link
from affiliate.howl_links import create_howl_link
from affiliate.mavely_links import get_mavely_link
from database.crud import create_affiliate_link
from database.models import AffiliateLink
from config.settings import get_settings


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
    Deduplicates: returns the existing link if one already exists for product+network.
    """
    settings = get_settings()

    # Return existing link if already created for this product+network
    existing = await session.execute(
        select(AffiliateLink)
        .where(AffiliateLink.product_id == product_id, AffiliateLink.network == network)
        .limit(1)
    )
    existing_link = existing.scalar_one_or_none()
    if existing_link:
        return f"{settings.base_url}/go/{existing_link.short_redirect_id}"

    affiliate_url: str | None = None

    if network == "amazon":
        if settings.amazon_associate_tag:
            affiliate_url = make_affiliate_link(product_url, settings.amazon_associate_tag)

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
