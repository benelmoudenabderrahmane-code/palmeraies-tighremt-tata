"""
AI Thumbnail Generator for YouTube
===================================
Creates a high-CTR thumbnail from a product image:
  • Extract product photo (background removed if rembg installed)
  • Bold gradient background per niche
  • Big product name + price burst
  • 1280x720 for YouTube, 1080x1920 variant for Shorts
"""
import io
import logging
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

logger = logging.getLogger(__name__)

NICHE_GRADIENTS = {
    "shoes":         [(245, 158, 11), (124, 58, 237)],   # gold → purple
    "electronics":   [(59, 130, 246), (16, 185, 129)],   # blue → green
    "fashion":       [(236, 72, 153), (251, 113, 133)],  # pink
    "beauty":        [(217, 70, 239), (236, 72, 153)],   # magenta
    "tech_gadgets":  [(14, 165, 233), (99, 102, 241)],   # cyan → indigo
    "fitness":       [(239, 68, 68), (245, 158, 11)],    # red → orange
    "sports":        [(34, 197, 94), (59, 130, 246)],    # green → blue
    "home":          [(168, 85, 247), (236, 72, 153)],
    "default":       [(212, 175, 55), (124, 58, 237)],   # gold → purple
}


def _font(size: int, bold: bool = False):
    """Try a list of common bold fonts, fallback to PIL default."""
    candidates = [
        "C:/Windows/Fonts/impact.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def _gradient_bg(w: int, h: int, colors: list[tuple]) -> Image.Image:
    """Vertical gradient between 2 colors."""
    base = Image.new("RGB", (w, h), colors[0])
    top = Image.new("RGB", (w, h), colors[1])
    mask = Image.new("L", (w, h))
    pixels = mask.load()
    for y in range(h):
        for x in range(w):
            pixels[x, y] = int(255 * y / h)
    base.paste(top, (0, 0), mask)
    return base


def _add_noise_texture(img: Image.Image, intensity: int = 12) -> Image.Image:
    """Add subtle grain for luxury feel."""
    import random as _r
    pixels = img.load()
    w, h = img.size
    for _ in range(int(w * h * 0.03)):
        x, y = _r.randint(0, w - 1), _r.randint(0, h - 1)
        r, g, b = pixels[x, y]
        delta = _r.randint(-intensity, intensity)
        pixels[x, y] = (
            max(0, min(255, r + delta)),
            max(0, min(255, g + delta)),
            max(0, min(255, b + delta)),
        )
    return img


def generate_youtube_thumbnail(
    output_path: str,
    product_name: str,
    price: float = 0.0,
    product_image_path: str | None = None,
    niche: str = "default",
    format: str = "youtube",   # "youtube" (1280x720) | "shorts" (1080x1920)
) -> str:
    """
    Render a high-CTR thumbnail and save to output_path.
    Returns the absolute path to the saved file.
    """
    w, h = (1280, 720) if format == "youtube" else (1080, 1920)
    colors = NICHE_GRADIENTS.get(niche, NICHE_GRADIENTS["default"])

    # 1. Gradient background
    img = _gradient_bg(w, h, colors)
    img = img.filter(ImageFilter.GaussianBlur(radius=2))

    # 2. Dark overlay band for text
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    band_height = int(h * 0.35)
    od.rectangle([(0, h - band_height), (w, h)], fill=(0, 0, 0, 180))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    # 3. Product image (if provided)
    if product_image_path and Path(product_image_path).exists():
        try:
            prod = Image.open(product_image_path).convert("RGBA")
            target_h = int(h * 0.55)
            ratio = target_h / prod.height
            prod = prod.resize((int(prod.width * ratio), target_h), Image.LANCZOS)
            px = w - prod.width - 60
            py = int(h * 0.08)
            img.paste(prod, (px, py), prod if prod.mode == "RGBA" else None)
        except Exception as exc:
            logger.warning("Thumbnail product image failed: %s", exc)

    # 4. Bold title text
    d = ImageDraw.Draw(img)
    title_size = int(h * 0.075)
    title_font = _font(title_size, bold=True)
    title = product_name[:40].upper()
    title_y = h - band_height + 30
    # Stroke (outline)
    for ox, oy in [(-3,-3),(-3,3),(3,-3),(3,3)]:
        d.text((60 + ox, title_y + oy), title, font=title_font, fill="black")
    d.text((60, title_y), title, font=title_font, fill="white")

    # 5. Price burst (if price > 0)
    if price > 0:
        burst_size = int(h * 0.18)
        burst_x = 60
        burst_y = h - 50 - burst_size
        # Yellow circle
        d.ellipse(
            [(burst_x, burst_y), (burst_x + burst_size, burst_y + burst_size)],
            fill=(255, 222, 0), outline="black", width=4
        )
        price_text = f"{price:.0f}€"
        price_font = _font(int(burst_size * 0.4), bold=True)
        bbox = d.textbbox((0, 0), price_text, font=price_font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        d.text(
            (burst_x + (burst_size - tw) // 2, burst_y + (burst_size - th) // 2 - 4),
            price_text, font=price_font, fill="black"
        )

    # 6. Niche tag (top-left)
    tag_font = _font(int(h * 0.035), bold=True)
    tag = niche.upper().replace("_", " ")
    d.rectangle([(40, 40), (40 + 220, 40 + 50)], fill=(255, 255, 255, 220))
    d.text((60, 50), tag, font=tag_font, fill="black")

    # 7. Sparkle / urgency element (top-right)
    if random.random() > 0.5:
        spark_font = _font(int(h * 0.045), bold=True)
        spark_text = random.choice(["NEW", "DEAL", "VIRAL", "TOP", "🔥"])
        d.text((w - 200, 50), spark_text, font=spark_font, fill=(255, 222, 0))

    # 8. Subtle noise for premium feel
    img = _add_noise_texture(img, intensity=8)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, "JPEG", quality=92, optimize=True)
    logger.info("Thumbnail saved: %s", output_path)
    return output_path
