import re
import httpx
from bs4 import BeautifulSoup


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


async def scrape_generic(url: str, html: str | None = None) -> dict:
    """Scrape any product page using Open Graph meta tags as fallback."""
    if html is None:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers=HEADERS)
            html = resp.text

    soup = BeautifulSoup(html, "html.parser")

    def og(prop: str) -> str:
        tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        return tag["content"].strip() if tag and tag.get("content") else ""

    name = og("og:title")
    if not name and soup.find("title"):
        name = soup.find("title").get_text(strip=True)
    name = name or "Unknown Product"

    # Find first price-like pattern
    price_match = re.search(r'\$\s*([\d,]+\.?\d*)', html)
    price = float(price_match.group(1).replace(",", "")) if price_match else 0.0

    image = og("og:image")

    return {
        "name": name,
        "price": price,
        "original_price": price,
        "discount_pct": 0.0,
        "description": og("og:description"),
        "images": [image] if image else [],
        "features": [],
        "star_rating": 0.0,
        "review_count": 0,
        "url": url,
        "brand": og("og:site_name"),
    }
