import re
import asyncio
import random
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup


def extract_asin(url: str) -> str | None:
    patterns = [
        r"/dp/([A-Z0-9]{10})",
        r"/gp/product/([A-Z0-9]{10})",
        r"asin=([A-Z0-9]{10})",
    ]
    for pat in patterns:
        m = re.search(pat, url)
        if m:
            return m.group(1)
    return None


async def scrape_amazon(url: str) -> dict:
    """Scrape Amazon product page using Playwright with realistic browser fingerprint."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            locale="en-US",
            viewport={"width": 1280, "height": 900},
            extra_http_headers={"Accept-Language": "en-US,en;q=0.9"},
        )
        page = await context.new_page()

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(random.uniform(2, 4))
            # Wait for price to render (JS-driven)
            try:
                await page.wait_for_selector(".a-price-whole", timeout=5000)
            except Exception:
                pass
            html = await page.content()
        finally:
            await browser.close()

    soup = BeautifulSoup(html, "html.parser")

    def text(selector: str) -> str:
        tag = soup.select_one(selector)
        return tag.get_text(strip=True) if tag else ""

    name = text("#productTitle") or text("h1.a-size-large") or "Amazon Product"

    # Price extraction — try multiple Amazon price selectors
    price = 0.0
    price_selectors = [
        (".a-price-whole", ".a-price-fraction"),
        ("#corePriceDisplay_desktop_feature_div .a-price-whole",
         "#corePriceDisplay_desktop_feature_div .a-price-fraction"),
        ("#apex_offerDisplay_desktop .a-price-whole",
         "#apex_offerDisplay_desktop .a-price-fraction"),
        ("#tp_price_block_total_price_ww .a-price-whole",
         "#tp_price_block_total_price_ww .a-price-fraction"),
    ]
    for whole_sel, frac_sel in price_selectors:
        whole = text(whole_sel)
        if whole:
            frac = text(frac_sel)
            try:
                price = float(f"{whole.replace(',', '').rstrip('.')}.{frac or '00'}")
                break
            except (ValueError, AttributeError):
                continue
    # Last resort: look for any .a-offscreen price text like "$24.99"
    if price == 0.0:
        for tag in soup.select(".a-offscreen"):
            raw = tag.get_text(strip=True).replace("$", "").replace(",", "")
            try:
                price = float(raw)
                if price > 0:
                    break
            except ValueError:
                continue

    # Original (strikethrough) price
    original_tag = soup.select_one(".a-text-price .a-offscreen")
    original_price = price
    if original_tag:
        try:
            original_price = float(original_tag.get_text().replace("$", "").replace(",", ""))
        except ValueError:
            original_price = price

    discount_pct = 0.0
    if original_price > price > 0:
        discount_pct = round((original_price - price) / original_price * 100, 1)

    # Images — Amazon stores them in the image block
    images = []
    for img in soup.select("img[data-old-hires]"):
        src = img.get("data-old-hires", "")
        if src and src not in images:
            images.append(src)
    # Fallback to regular src
    if not images:
        for img in soup.select("#imgTagWrapperId img, #imageBlock img"):
            src = img.get("src", "")
            if src and "https" in src and src not in images:
                images.append(src)

    # Bullet features
    features = [
        li.get_text(strip=True)
        for li in soup.select("#feature-bullets li span.a-list-item")
        if li.get_text(strip=True)
    ][:8]

    desc_tag = soup.select_one("#productDescription p")
    description = desc_tag.get_text(strip=True) if desc_tag else ""

    # Rating
    star_rating = 0.0
    rating_tag = soup.select_one("span[data-hook='rating-out-of-text']") or soup.select_one(".a-icon-alt")
    if rating_tag:
        m = re.search(r"([\d.]+)", rating_tag.get_text())
        if m:
            star_rating = float(m.group(1))

    # Review count
    review_count = 0
    review_tag = soup.select_one("#acrCustomerReviewText")
    if review_tag:
        m = re.search(r"([\d,]+)", review_tag.get_text())
        if m:
            review_count = int(m.group(1).replace(",", ""))

    # Brand
    brand_tag = soup.select_one("#bylineInfo")
    brand = brand_tag.get_text(strip=True).replace("Brand: ", "").replace("Visit the ", "").replace(" Store", "") if brand_tag else ""

    return {
        "name": name,
        "brand": brand,
        "price": price,
        "original_price": original_price,
        "discount_pct": discount_pct,
        "description": description,
        "features": features,
        "images": images[:5],
        "star_rating": star_rating,
        "review_count": review_count,
        "url": url,
    }
