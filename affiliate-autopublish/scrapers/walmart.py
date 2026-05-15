import json
import asyncio
import random
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup


async def scrape_walmart(url: str) -> dict:
    """Scrape Walmart product page. Tries __NEXT_DATA__ JSON first, falls back to HTML."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            locale="en-US",
        )
        page = await context.new_page()
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(random.uniform(2, 3))
            html = await page.content()
        finally:
            await browser.close()

    soup = BeautifulSoup(html, "html.parser")

    # Walmart embeds full product data in __NEXT_DATA__
    script = soup.find("script", id="__NEXT_DATA__")
    if script:
        try:
            data = json.loads(script.string)
            product = (
                data.get("props", {})
                    .get("pageProps", {})
                    .get("initialData", {})
                    .get("data", {})
                    .get("product", {})
            )
            if product:
                name = product.get("name", "Walmart Product")
                price_info = product.get("priceInfo", {})
                price = float(price_info.get("currentPrice", {}).get("price", 0) or 0)
                was_price = price_info.get("wasPrice", {}).get("price")
                original_price = float(was_price) if was_price else price
                discount_pct = 0.0
                if original_price > price > 0:
                    discount_pct = round((original_price - price) / original_price * 100, 1)

                thumbnails = product.get("imageInfo", {}).get("thumbnails", [])
                images = [t["url"] for t in thumbnails if t.get("url")][:5]

                short_desc = product.get("shortDescription", "") or ""
                # Strip HTML tags from short description
                desc_soup = BeautifulSoup(short_desc, "html.parser")
                description = desc_soup.get_text(strip=True)
                features = [li.get_text(strip=True) for li in desc_soup.find_all("li")][:6]

                return {
                    "name": name,
                    "brand": product.get("brand", ""),
                    "price": price,
                    "original_price": original_price,
                    "discount_pct": discount_pct,
                    "description": description,
                    "features": features,
                    "images": images,
                    "star_rating": float(product.get("averageRating", 0) or 0),
                    "review_count": int(product.get("numberOfReviews", 0) or 0),
                    "url": url,
                }
        except (KeyError, TypeError, json.JSONDecodeError):
            pass

    # HTML fallback
    name_tag = soup.select_one('[itemprop="name"]') or soup.select_one("h1")
    name = name_tag.get_text(strip=True) if name_tag else "Walmart Product"
    price_tag = soup.select_one('[itemprop="price"]')
    price = float(price_tag.get("content", 0)) if price_tag else 0.0
    images = [img["src"] for img in soup.select("img[data-testid='hero-image']") if img.get("src")]

    return {
        "name": name,
        "brand": "",
        "price": price,
        "original_price": price,
        "discount_pct": 0.0,
        "description": "",
        "features": [],
        "images": images[:5],
        "star_rating": 0.0,
        "review_count": 0,
        "url": url,
    }
