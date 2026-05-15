import os
from pathlib import Path
from io import BytesIO

import httpx
from PIL import Image, ImageDraw, ImageFont

FONTS_DIR = Path(__file__).parent.parent / "assets" / "fonts"


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    """Load Anton font, fall back to PIL default if not found."""
    font_path = FONTS_DIR / "Anton-Regular.ttf"
    try:
        return ImageFont.truetype(str(font_path), size)
    except (OSError, IOError):
        try:
            return ImageFont.load_default(size=size)
        except TypeError:
            return ImageFont.load_default()


async def _download_image(url: str) -> Image.Image | None:
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
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
    """Generate a 1200×1200 deal image. Returns the saved file path."""
    W, H = 1200, 1200
    img = Image.new("RGB", (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Top banner
    draw.rectangle([0, 0, W, 110], fill=(10, 10, 10))
    banner_font = _load_font(52)
    store = network.upper()
    banner_text = f"{store} BEST DEAL 🔥🔥"
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
        cta_text = f"SAVE {discount_pct:.0f}% OFF TODAY! 💥"
    else:
        cta_text = "LIMITED TIME OFFER ⏰ GRAB IT NOW!"
    draw.text((W // 2, H - 70), cta_text, font=cta_font, fill=(255, 220, 0), anchor="mm")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    img.convert("RGB").save(output_path, "JPEG", quality=92)
    return output_path
