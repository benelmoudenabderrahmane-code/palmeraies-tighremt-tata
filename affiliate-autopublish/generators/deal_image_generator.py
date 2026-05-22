import os
import re
from pathlib import Path
from io import BytesIO

import httpx
from PIL import Image, ImageDraw, ImageFont


def _strip_emoji(text: str) -> str:
    """Remove emoji and non-BMP characters that Pillow/TTF fonts can't render."""
    return re.sub(r"[^\x00-\x7FÀ-ɏ]", "", text).strip()

FONTS_DIR = Path(__file__).parent.parent / "assets" / "fonts"
_ANTON_URL = "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf"


def _ensure_font() -> Path:
    """Return path to Anton-Regular.ttf, downloading it if absent."""
    font_path = FONTS_DIR / "Anton-Regular.ttf"
    if font_path.exists():
        return font_path
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    try:
        import urllib.request
        urllib.request.urlretrieve(_ANTON_URL, str(font_path))
    except Exception:
        pass
    return font_path


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    """Load Anton font (auto-downloaded), fall back to PIL default if unavailable."""
    font_path = _ensure_font()
    try:
        return ImageFont.truetype(str(font_path), size)
    except (OSError, IOError):
        try:
            return ImageFont.load_default(size=size)
        except TypeError:
            return ImageFont.load_default()


_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Referer": "https://www.amazon.com/",
}


async def _download_image(url: str) -> Image.Image | None:
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers=_HEADERS, verify=False) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return Image.open(BytesIO(resp.content)).convert("RGBA")
    except Exception:
        pass
    return None


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    """Break text into lines that fit within max_width pixels."""
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


async def create_deal_image(
    product_name: str,
    price: float,
    image_url: str | None,
    network: str = "amazon",
    discount_pct: float = 0.0,
    output_path: str = "deal.jpg",
) -> str:
    """Generate a deal image. Tries Canva template first, falls back to Pillow."""
    from generators.canva_deal_image_generator import create_canva_deal_image
    if await create_canva_deal_image(product_name, price, image_url, network, output_path):
        return output_path
    W, H = 1200, 1200
    img = Image.new("RGB", (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Top banner
    draw.rectangle([0, 0, W, 110], fill=(10, 10, 10))
    banner_font = _load_font(52)
    store = network.upper()
    banner_text = _strip_emoji(f"{store} BEST DEAL")
    draw.text((W // 2, 55), banner_text, font=banner_font, fill=(255, 255, 255), anchor="mm")

    # Product name (wrapped, dark text)
    name_font = _load_font(44)
    name_short = product_name[:100] + ("..." if len(product_name) > 100 else "")
    lines = _wrap_text(draw, name_short, name_font, W - 60)
    y = 130
    for line in lines[:3]:
        draw.text((W // 2, y), line, font=name_font, fill=(20, 20, 20), anchor="ma")
        y += 58

    # Product image (centered, large)
    if image_url:
        product_img = await _download_image(image_url)
        if product_img:
            max_size = 680
            product_img.thumbnail((max_size, max_size), Image.LANCZOS)
            px = (W - product_img.width) // 2
            py = max(y + 20, 280)
            if product_img.mode == "RGBA":
                img.paste(product_img, (px, py), product_img)
            else:
                img.paste(product_img, (px, py))

    # Bottom price strip
    draw.rectangle([0, H - 260, W, H - 140], fill=(200, 0, 0))
    price_font = _load_font(80)
    draw.text((W // 2, H - 200), f"${price:.2f}", font=price_font, fill=(255, 255, 255), anchor="mm")

    # Discount / CTA bar
    draw.rectangle([0, H - 140, W, H], fill=(10, 10, 10))
    cta_font = _load_font(46)
    if discount_pct > 0:
        cta_text = f"SAVE {discount_pct:.0f}% OFF TODAY!"
    else:
        cta_text = "LIMITED TIME OFFER - GRAB IT NOW!"
    draw.text((W // 2, H - 70), cta_text, font=cta_font, fill=(255, 220, 0), anchor="mm")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    img.convert("RGB").save(output_path, "JPEG", quality=92)
    return output_path
