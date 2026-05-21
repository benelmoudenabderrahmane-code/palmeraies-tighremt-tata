"""
YouTube SEO Metadata Generator — powered by youtube-creator skill

Research applied:
  • youtube-creator: keyword-first titles, 125-char above-fold description, 15+ tags
  • BuzzSumo: 60-char title sweet spot, numbers in titles +20% CTR
  • YouTube algorithm: first 125 chars of description indexed for search
  • Tag strategy: product name + category + problem keywords + long-tail
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


async def generate_youtube_metadata(
    product_name: str,
    price: float,
    features: list[str],
    affiliate_link: str,
    caption: str = "",
    star_rating: float = 0.0,
    review_count: int = 0,
) -> dict:
    """
    Returns YouTube-optimized title, description, and tags.
    Used to replace generic product name in n8n YouTube upload.
    """
    features_text = ", ".join(features[:4]) if features else ""
    rating_text = f"{star_rating:.1f} stars, {review_count:,} reviews" if star_rating > 0 else ""
    price_text = f"${price:.2f}" if price > 0 else ""

    prompt = f"""You are a YouTube SEO expert. Generate optimized upload metadata.

YOUTUBE SEO RULES:
- Title: 50-60 chars max. PRIMARY KEYWORD first. Include price or rating if impressive.
  Formats that work: "Best [Product] Under $X", "[Product] Review: [Key Benefit]",
  "I Tested [Product] — Here's What Happened"
  NEVER exceed 100 chars (API limit).
- Description: First 125 chars show before "Show more" — make them count with keywords.
  Include affiliate link in first paragraph. Total: 200-400 chars.
- Tags: 15 tags total. Mix: exact product name, category terms, problem keywords,
  long-tail ("best [product] 2026", "is [product] worth it", "[product] review").

PRODUCT:
Name: {product_name}
Price: {price_text}
Features: {features_text}
{f'Rating: {rating_text}' if rating_text else ''}
Link: {affiliate_link}
Caption hint: {caption[:150] if caption else ''}

OUTPUT FORMAT:
TITLE:
[YouTube title — max 60 chars, keyword-first]

DESCRIPTION:
[First 125 chars must be keyword-rich. Include link. 200-400 chars total.]

TAGS:
[15 comma-separated tags]

Output only the labeled sections."""

    text = await _groq_chat([{"role": "user", "content": prompt}], max_tokens=600)

    # Parse sections
    metadata: dict[str, str] = {}
    current_key: str | None = None
    current_lines: list[str] = []

    for line in text.split("\n"):
        matched = False
        for label in ("TITLE", "DESCRIPTION", "TAGS"):
            if line.strip().startswith(label + ":") or line.strip() == label:
                if current_key:
                    metadata[current_key] = "\n".join(current_lines).strip()
                current_key = label
                rest = line.split(":", 1)[-1].strip() if ":" in line else ""
                current_lines = [rest] if rest else []
                matched = True
                break
        if not matched and current_key:
            current_lines.append(line)
    if current_key:
        metadata[current_key] = "\n".join(current_lines).strip()

    # Enforce YouTube title limit
    title = metadata.get("TITLE", product_name)
    if len(title) > 100:
        title = title[:97] + "..."
    metadata["TITLE"] = title

    # Parse tags into list
    tags_raw = metadata.get("TAGS", "")
    tags_list = [t.strip() for t in tags_raw.split(",") if t.strip()][:15]
    metadata["TAGS_LIST"] = tags_list  # type: ignore[assignment]

    return metadata
