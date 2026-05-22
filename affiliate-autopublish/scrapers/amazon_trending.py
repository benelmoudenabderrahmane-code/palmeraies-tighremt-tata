"""
Amazon Trending Product Discovery
==================================
Scrapes Amazon Best Sellers + Movers & Shakers + New Releases pages
across multiple categories to surface winning products to film.

Returns a list of products with: title, asin, image, rating, price, category, rank.
Scoring filters out products with poor reviews or no ratings.

No PA-API needed — uses regular product pages with rotating user agents.
"""
import asyncio
import logging
import random
import re
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
]

# Amazon Best Seller category endpoints (FR)
CATEGORIES = {
    "electronics":     "https://www.amazon.fr/gp/bestsellers/electronics",
    "fashion":         "https://www.amazon.fr/gp/bestsellers/fashion",
    "sports":          "https://www.amazon.fr/gp/bestsellers/sports",
    "beauty":          "https://www.amazon.fr/gp/bestsellers/beauty",
    "home":            "https://www.amazon.fr/gp/bestsellers/kitchen",
    "tech_gadgets":    "https://www.amazon.fr/gp/bestsellers/computers",
    "shoes":           "https://www.amazon.fr/gp/bestsellers/shoes",
    "fitness":         "https://www.amazon.fr/gp/movers-and-shakers/sports",
    "new_releases":    "https://www.amazon.fr/gp/new-releases/electronics",
}


def _headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }


def _parse_price(text: str) -> float:
    if not text:
        return 0.0
    cleaned = re.sub(r"[^\d,.]", "", text).replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _parse_rating(text: str) -> float:
    if not text:
        return 0.0
    match = re.search(r"(\d+[,.]\d+)", text)
    if not match:
        return 0.0
    try:
        return float(match.group(1).replace(",", "."))
    except ValueError:
        return 0.0


async def _fetch_page(url: str, client: httpx.AsyncClient) -> str:
    """Fetch a single Amazon page with retries."""
    for attempt in range(3):
        try:
            resp = await client.get(url, headers=_headers(), timeout=20)
            if resp.status_code == 200:
                return resp.text
            logger.warning("Amazon page returned %s on attempt %d", resp.status_code, attempt)
        except httpx.RequestError as exc:
            logger.warning("Amazon fetch failed: %s", exc)
        await asyncio.sleep(2 ** attempt)
    return ""


def _parse_bestsellers(html: str, category: str) -> list[dict]:
    """Extract products from a Best Sellers page."""
    soup = BeautifulSoup(html, "html.parser")
    products = []

    # Amazon best sellers use grid items
    items = soup.select("[id^='gridItemRoot'], .zg-grid-general-faceout")

    for rank, item in enumerate(items[:30], start=1):
        title_el = item.select_one("div._cDEzb_p13n-sc-css-line-clamp-3_g3dy1, .p13n-sc-truncate-desktop-type2, ._cDEzb_p13n-sc-css-line-clamp-1_1Fn1y")
        img_el   = item.select_one("img")
        link_el  = item.select_one("a.a-link-normal[href*='/dp/']")
        price_el = item.select_one("._cDEzb_p13n-sc-price_3mJ9Z, .p13n-sc-price, .a-color-price")
        rating_el = item.select_one("[class*='a-icon-alt']")

        if not (title_el and link_el):
            continue

        title = title_el.get_text(strip=True)
        href  = link_el.get("href", "")
        # Extract ASIN
        asin_match = re.search(r"/dp/([A-Z0-9]{10})", href)
        if not asin_match:
            continue
        asin = asin_match.group(1)

        product = {
            "asin": asin,
            "title": title[:200],
            "image_url": img_el.get("src", "") if img_el else "",
            "amazon_url": f"https://www.amazon.fr/dp/{asin}",
            "price": _parse_price(price_el.get_text() if price_el else ""),
            "rating": _parse_rating(rating_el.get_text() if rating_el else ""),
            "category": category,
            "rank_in_category": rank,
            "source": "bestsellers",
        }
        products.append(product)

    return products


async def discover_trending_products(
    categories: list[str] | None = None,
    min_rating: float = 4.0,
    max_per_category: int = 10,
) -> list[dict]:
    """
    Scrape multiple Amazon categories in parallel and return winning products.

    Args:
        categories:      subset to scan (defaults to all CATEGORIES)
        min_rating:      filter out products under this rating (0 = no rating yet)
        max_per_category: cap results per category

    Returns:
        Sorted list of products by score (rank + rating + price weight).
    """
    selected = categories or list(CATEGORIES.keys())
    urls = [(cat, CATEGORIES[cat]) for cat in selected if cat in CATEGORIES]

    async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
        pages = await asyncio.gather(
            *[_fetch_page(url, client) for _, url in urls],
            return_exceptions=False,
        )

    all_products: list[dict] = []
    for (category, _), html in zip(urls, pages):
        if not html:
            continue
        parsed = _parse_bestsellers(html, category)
        # Keep top N per category, filter by rating (or no rating = treat as 4.0)
        keep = [p for p in parsed if (p["rating"] >= min_rating or p["rating"] == 0)][:max_per_category]
        all_products.extend(keep)

    # Score: higher rank = better (rank 1 = best). Add rating bonus.
    for p in all_products:
        rank_score   = max(0, 30 - p["rank_in_category"]) / 30        # 0-1
        rating_score = (p["rating"] / 5.0) if p["rating"] > 0 else 0.7
        price_score  = 0.5 if 20 <= p["price"] <= 150 else 0.3        # sweet spot
        p["score"]   = round(rank_score * 0.5 + rating_score * 0.3 + price_score * 0.2, 3)

    all_products.sort(key=lambda x: x["score"], reverse=True)
    logger.info("Discovered %d trending products across %d categories", len(all_products), len(urls))
    return all_products


async def get_daily_picks(count: int = 5) -> list[dict]:
    """Return the top N products to film today."""
    products = await discover_trending_products()
    return products[:count]
