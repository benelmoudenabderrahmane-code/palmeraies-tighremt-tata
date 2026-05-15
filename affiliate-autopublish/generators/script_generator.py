import anthropic
from config.settings import get_settings

settings = get_settings()

PLATFORM_SPECS = {
    "tiktok": {
        "duration": "30-45 seconds",
        "style": "casual, energetic, fast-paced, Gen-Z energy",
        "format": "9:16 vertical",
    },
    "instagram": {
        "duration": "30-45 seconds",
        "style": "casual, aspirational, lifestyle-focused",
        "format": "9:16 Reels",
    },
    "youtube_shorts": {
        "duration": "45-60 seconds",
        "style": "engaging, slightly detailed, enthusiastic",
        "format": "9:16 YouTube Shorts",
    },
    "facebook": {
        "duration": "60-90 seconds",
        "style": "informative, conversational, trust-building",
        "format": "16:9 Facebook video",
    },
    "youtube": {
        "duration": "60-90 seconds",
        "style": "structured, detailed, SEO-friendly",
        "format": "16:9 YouTube",
    },
}


async def generate_video_script(
    product_name: str,
    price: float,
    features: list[str],
    description: str,
    affiliate_link: str,
    platform: str = "tiktok",
    star_rating: float = 0.0,
    review_count: int = 0,
) -> dict:
    spec = PLATFORM_SPECS.get(platform, PLATFORM_SPECS["tiktok"])
    features_text = "\n".join(f"- {f}" for f in features[:5]) if features else "- No features listed"
    rating_text = f"{star_rating}/5 stars ({review_count:,} reviews)" if star_rating > 0 else ""

    prompt = f"""Write a {spec['duration']} video script for {platform.upper()} ({spec['format']}).
Style: {spec['style']}

PRODUCT DETAILS:
Name: {product_name}
Price: ${price:.2f}
Description: {description[:300] if description else 'Great product'}
Key features:
{features_text}
{f'Rating: {rating_text}' if rating_text else ''}

Write the script with these exact labeled sections:

HOOK: (3-5 seconds) — Bold claim or question that immediately stops scrolling. No generic opener.
PROBLEM: (5-10 seconds) — The pain point or desire this product addresses.
SOLUTION: (10-20 seconds) — Introduce the product as the answer. Name 3 specific benefits.
SOCIAL_PROOF: (5 seconds) — Mention ratings, reviews, or popularity.
CTA: (5 seconds) — "Get it now — link in bio/description!" style close.

Then provide:
TITLE_OPTIONS:
1. [title 1]
2. [title 2]
3. [title 3]

DESCRIPTION:
[Full platform description with {affiliate_link} embedded naturally near the end]

HASHTAGS:
[15-20 relevant hashtags as single line]

Output only the labeled sections — no extra commentary."""

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response.content[0].text.strip()

    # Parse labeled sections
    sections: dict[str, str] = {}
    current_key: str | None = None
    current_lines: list[str] = []
    labels = ["HOOK", "PROBLEM", "SOLUTION", "SOCIAL_PROOF", "CTA", "TITLE_OPTIONS", "DESCRIPTION", "HASHTAGS"]

    for line in text.split("\n"):
        matched = False
        for label in labels:
            if line.strip().startswith(label + ":") or line.strip() == label:
                if current_key:
                    sections[current_key] = "\n".join(current_lines).strip()
                current_key = label
                rest = line.split(":", 1)[-1].strip() if ":" in line else ""
                current_lines = [rest] if rest else []
                matched = True
                break
        if not matched and current_key:
            current_lines.append(line)

    if current_key:
        sections[current_key] = "\n".join(current_lines).strip()

    return {
        "platform": platform,
        "full_script": text,
        "sections": sections,
    }
