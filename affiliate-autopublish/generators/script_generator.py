"""
Video Script Generator — powered by viral-content + youtube-creator + affiliate-skills

Research applied:
  • BuzzSumo 100M headlines: 11 words optimal, numbers outperform, curiosity gap
  • Outbrain: negative superlatives beat positive by 63%
  • Netflix 1.8s decision window: hook must land in first sentence
  • YouTube retention engineering: loop open → pattern interrupt at 30s → CTA at 70%
  • TikTok affiliate formula: Hook → Pain → Demo → Result → CTA (45s)
  • Affiliate-skills: demo-first hooks, social proof integration
"""
import asyncio
import httpx
from openai import AsyncOpenAI, RateLimitError, APIConnectionError
from config.settings import get_settings


def _make_groq_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=get_settings().groq_api_key,
        base_url="https://api.groq.com/openai/v1",
        http_client=httpx.AsyncClient(verify=False),
    )


async def _groq_chat(messages: list, max_tokens: int) -> str:
    client = _make_groq_client()
    for attempt in range(4):
        try:
            resp = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                max_tokens=max_tokens,
                messages=messages,
            )
            return resp.choices[0].message.content.strip()
        except (RateLimitError, APIConnectionError):
            if attempt == 3:
                raise
            await asyncio.sleep(2 ** attempt)
    raise RuntimeError("Groq unreachable after retries")


# ── Platform specs with viral-content research baked in ──────────────────────
PLATFORM_SPECS = {
    "tiktok": {
        "duration": "45 seconds",
        "style": "casual, energetic, Gen-Z, scroll-stopping demo-first",
        "format": "9:16 vertical",
        "hook_style": "DEMO-FIRST: Show the result/transformation in second 1. Pattern interrupt.",
        "structure": "Hook(0-3s) → Pain(3-8s) → Demo(8-30s) → Result(30-38s) → CTA(38-45s)",
        "title_rule": "Max 60 chars. Start with number or power word. Curiosity gap.",
    },
    "instagram": {
        "duration": "30-45 seconds",
        "style": "aspirational, lifestyle, visually driven",
        "format": "9:16 Reels",
        "hook_style": "VISUAL HOOK: describe a visual that stops the scroll. Bold claim first.",
        "structure": "Hook(0-3s) → Problem(3-10s) → Solution(10-30s) → Social Proof(30-38s) → CTA(38-45s)",
        "title_rule": "Max 60 chars. Lifestyle angle. Emotion trigger.",
    },
    "youtube_shorts": {
        "duration": "50-60 seconds",
        "style": "engaging, slightly detailed, enthusiastic",
        "format": "9:16 YouTube Shorts",
        "hook_style": "LOOP HOOK: start with the best moment, create anticipation for full reveal.",
        "structure": "Hook(0-5s) → Problem(5-12s) → Solution+Demo(12-45s) → Social Proof(45-52s) → CTA(52-60s)",
        "title_rule": "Max 60 chars. Keyword-first. 'Why I' or 'This [product] does...' format.",
    },
    "youtube": {
        "duration": "90 seconds",
        "style": "structured, retention-engineered, SEO-optimized",
        "format": "16:9 YouTube",
        "hook_style": "RETENTION HOOK: open a loop in first 5s. Tease the payoff. Pattern interrupt at 30s mark.",
        "structure": "Hook(0-10s) → Problem(10-20s) → Solution+Demo(20-65s) → Social Proof(65-75s) → CTA(75-90s)",
        "title_rule": "Max 60 chars. Primary keyword first. Emotional trigger. Never clickbait.",
    },
    "facebook": {
        "duration": "60-90 seconds",
        "style": "informative, conversational, trust-building",
        "format": "16:9 Facebook video",
        "hook_style": "CURIOSITY HOOK: 'Most people don't know this about [product]...' builds trust.",
        "structure": "Hook(0-8s) → Problem(8-20s) → Solution(20-55s) → Social Proof(55-70s) → CTA(70-90s)",
        "title_rule": "Max 80 chars. Conversational. Deal/value angle.",
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
    rating_text = f"{star_rating:.1f}/5 stars ({review_count:,} reviews)" if star_rating > 0 else ""
    price_text = f"${price:.2f}" if price > 0 else "great price"

    prompt = f"""You are an expert {platform.upper()} creator and affiliate marketer.
Write a {spec['duration']} video script using viral content research.

VIRAL RULES (from 100M headline study + Netflix 1.8s research):
- Hook MUST land in the first sentence — no warm-up, no intro
- Use SPECIFIC numbers, not vague claims ("4.7 stars, 12,000+ reviews" not "highly rated")
- {spec['hook_style']}
- Structure: {spec['structure']}
- Title rule: {spec['title_rule']}
- Negative specificity beats positive: "Stop wasting money on X" > "Save money with X"
- Social proof triggers: real numbers, star ratings, review counts

PRODUCT:
Name: {product_name}
Price: {price_text}
Features:
{features_text}
Description: {description[:300] if description else 'Top-rated product'}
{f'Rating: {rating_text}' if rating_text else ''}
Affiliate link: {affiliate_link}

OUTPUT FORMAT — use exactly these labels:

HOOK:
[3-5 second scroll-stopping opener — apply the hook style above]

PROBLEM:
[The pain point or desire this product solves]

SOLUTION:
[Product as answer — 3 specific benefits with numbers]

SOCIAL_PROOF:
[Real stats: ratings, reviews, or "X people bought this week"]

CTA:
[Platform-native close: "Link in bio!" for TikTok/IG, "Link in description!" for YouTube]

TITLE_OPTIONS:
1. [title — max 60 chars, keyword-first]
2. [title — number-led or curiosity gap]
3. [title — emotion trigger + benefit]

DESCRIPTION:
[Platform-optimized description. First 125 chars must be keyword-rich (shown before "more"). Include {affiliate_link} naturally near end. Add 3-5 line breaks for readability.]

HASHTAGS:
[15-20 platform-native hashtags — mix niche + broad, single line]

YOUTUBE_TAGS:
[15 comma-separated tags for YouTube SEO — include product name, category, problem keywords]

Output only the labeled sections — no extra commentary or meta-text."""

    text = await _groq_chat([{"role": "user", "content": prompt}], max_tokens=1800)

    sections: dict[str, str] = {}
    current_key: str | None = None
    current_lines: list[str] = []
    labels = [
        "HOOK", "PROBLEM", "SOLUTION", "SOCIAL_PROOF", "CTA",
        "TITLE_OPTIONS", "DESCRIPTION", "HASHTAGS", "YOUTUBE_TAGS",
    ]

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

    # Pick best title (first option, trimmed to 100 chars for YouTube safety)
    title_block = sections.get("TITLE_OPTIONS", "")
    best_title = product_name[:100]
    for line in title_block.split("\n"):
        stripped = line.lstrip("123456789. ").strip()
        if stripped and len(stripped) >= 10:
            best_title = stripped[:100]
            break
    sections["BEST_TITLE"] = best_title

    return {
        "platform": platform,
        "full_script": text,
        "sections": sections,
    }
