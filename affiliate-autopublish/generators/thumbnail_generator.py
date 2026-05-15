import os
from io import BytesIO
from pathlib import Path

import httpx
from PIL import Image, ImageDraw, ImageFont

FONTS_DIR = Path(__file__).parent.parent / "assets" / "fonts"


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    font_path = FONTS_DIR / "Anton-Regular.ttf"
    try:
        return ImageFont.truetype(str(font_path), size)
    except (OSError, IOError):
        try:
            return ImageFont.load_default(size=size)
        except TypeError:
            return ImageFont.load_default()


async def generate_thumbnail(
    product_name: str,
    price: float,
    image_url: str | None,
    output_path: str,
) -> str:
    """Generate a 1280×720 YouTube thumbnail. Returns the saved file path."""
    W, H = 1280, 720
    img = Image.new("RGB", (W, H), (15, 15, 40))
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(H):
        r = int(15 + (y / H) * 25)
        g = int(15 + (y / H) * 10)
        b = int(40 + (y / H) * 40)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # Product image on left half
    if image_url:
        try:
            async with httpx.AsyncClient(timeout=8, follow_redirects=True) as c:
                resp = await c.get(image_url)
                if resp.status_code == 200:
                    pimg = Image.open(BytesIO(resp.content)).convert("RGBA")
                    pimg.thumbnail((560, 560), Image.LANCZOS)
                    px = 20
                    py = (H - pimg.height) // 2
                    img.paste(pimg, (px, py), pimg)
        except Exception:
            pass

    # Text panel on right
    name_short = (product_name[:32] + "...") if len(product_name) > 32 else product_name

    # Product name
    name_font = _load_font(62)
    draw.text((620, 80), name_short, font=name_font, fill=(255, 255, 255))

    # Price badge
    draw.rectangle([620, 240, 950, 340], fill=(220, 30, 30))
    price_font = _load_font(74)
    draw.text((785, 290), f"${price:.2f}", font=price_font, fill=(255, 255, 255), anchor="mm")

    # Deal tag
    deal_font = _load_font(48)
    draw.text((620, 370), "🔥 BEST DEAL", font=deal_font, fill=(255, 220, 0))

    # CTA
    cta_font = _load_font(38)
    draw.text((620, 450), "Link in description 👇", font=cta_font, fill=(180, 180, 180))

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    img.save(output_path, "JPEG", quality=92)
    return output_path
