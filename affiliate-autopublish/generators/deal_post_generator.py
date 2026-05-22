"""
Deal Post Generator — powered by affiliate-skills + viral-content + openclaudia-marketing

Research applied:
  • Affiliate-skills: scarcity/urgency triggers, social proof integration, platform-native voice
  • Viral-content: negative superlatives, numbers, curiosity gap, 11-word title rule
  • OpenClaudia: platform-specific character limits and tone (Facebook vs Instagram)
  • Conversion principles: loss aversion > gain framing, specific numbers > vague claims
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


# ── Style prompts with affiliate-skills + viral research ─────────────────────
STYLE_PROMPTS = {
    "best_deal": {
        "fb_opener": "🛍️ *BEST DEALS — SAVE MONEY. LIVE BETTER!* 🛍️🚀",
        "instruction": (
            "Write a Facebook Group deal post. Lead with the savings/value. "
            "Create FOMO with real numbers (price, discount %). "
            "Community tone — like a friend tipping off the group."
        ),
        "ig_instruction": (
            "Write an Instagram caption. Lifestyle angle first — how this improves their life. "
            "Then reveal the price as a pleasant surprise. Emoji-rich. End with CTA + hashtags."
        ),
    },
    "price_drop": {
        "fb_opener": "💥 PRICE DROP ALERT 💥",
        "instruction": (
            "Write a Facebook deal post for a price drop. "
            "Lead with the original price and new price for maximum impact. "
            "Loss aversion angle: 'Stop paying X when you can get it for Y today.'"
        ),
        "ig_instruction": (
            "Write an Instagram caption about a price drop. "
            "Visual storytelling: was €X, now €Y. Use ❌/✅ or before/after framing. "
            "Create urgency — prices can go back up."
        ),
    },
    "limited_time": {
        "fb_opener": "⏰🔥 LIMITED TIME DEAL — DON'T MISS THIS! 🔥⏰",
        "instruction": (
            "Write a Facebook deal post with maximum urgency. "
            "Scarcity triggers: 'only X left', 'ends tonight', 'selling fast'. "
            "Real social proof: 'X people grabbed this already today.'"
        ),
        "ig_instruction": (
            "Write an Instagram caption with urgency. "
            "Countdown energy without fake timers. 'Saw this selling out last time...' "
            "FOMO: show what they'll miss if they skip."
        ),
    },
    "top_rated": {
        "fb_opener": "⭐ TOP RATED — THOUSANDS LOVE THIS! ⭐",
        "instruction": (
            "Write a Facebook deal post built entirely on social proof. "
            "Lead with the rating and review count. Quote-style social proof. "
            "Authority bias: 'Over X buyers can't be wrong.'"
        ),
        "ig_instruction": (
            "Write an Instagram caption highlighting social proof. "
            "Customer-voice angle: 'X thousand people rated this 5 stars for a reason.' "
            "Build credibility, then reveal price as the deal."
        ),
    },
}

# Platform-specific rules
PLATFORM_RULES = {
    "facebook_group": {
        "max_lines": 6,
        "tone": "conversational Facebook group, like a trusted friend in the community",
        "format": "emoji-heavy, ALL CAPS for key claims, link on its own line",
        "hashtags": "2-3 max (Facebook hates hashtag spam)",
        "char_limit": "~400 chars ideal",
    },
    "instagram": {
        "max_lines": 8,
        "tone": "aspirational Instagram, lifestyle-focused",
        "format": "emoji rhythm every 1-2 lines, aesthetic line breaks",
        "hashtags": "20-25 (hidden in comments or after 3 dots)",
        "char_limit": "~150 chars before 'more' cutoff — make those count",
    },
}


async def generate_deal_post(
    product_name: str,
    price: float,
    affiliate_link: str,
    style: str = "best_deal",
    original_price: float | None = None,
    network: str = "amazon",
    platform: str = "facebook_group",
) -> str:
    store = network.upper()
    discount_text = ""
    savings = 0.0
    if original_price and original_price > price > 0:
        discount_pct = int((original_price - price) / original_price * 100)
        savings = original_price - price
        discount_text = f" (was ${original_price:.2f} — SAVE ${savings:.2f} / {discount_pct}% OFF!)"

    style_data = STYLE_PROMPTS.get(style, STYLE_PROMPTS["best_deal"])
    platform_rules = PLATFORM_RULES.get(platform, PLATFORM_RULES["facebook_group"])

    is_instagram = platform == "instagram"
    opener = style_data["fb_opener"] if not is_instagram else ""
    instruction = style_data["ig_instruction"] if is_instagram else style_data["instruction"]

    prompt = f"""You are an expert affiliate marketer writing for {platform.replace('_', ' ').title()}.

COPYWRITING RULES (from affiliate-skills + viral content research):
- Loss aversion beats gain framing: "Don't miss X" > "Get X"
- Specific numbers convert better than vague: "$47 off" > "big savings"
- Social proof anchors trust: ratings, review counts, sold counts
- Scarcity is real: price could change, stock could run out
- Tone: {platform_rules['tone']}
- Format: {platform_rules['format']}
- Hashtags: {platform_rules['hashtags']}
- Ideal length: {platform_rules['char_limit']}

PRODUCT:
Name: {product_name}
Store: {store}
Price: ${price:.2f}{discount_text}
Link: {affiliate_link}

TASK:
{instruction}

STRICT RULES:
- Max {platform_rules['max_lines']} lines
- The affiliate link MUST appear on its own line
- Last line must be exactly: #ad
{f'- Start with: {opener}' if opener else ''}
- No filler phrases ("amazing", "incredible", "you need this")
- Every claim must be specific and credible

Output ONLY the post text. Nothing else."""

    post_text = await _groq_chat([{"role": "user", "content": prompt}], max_tokens=400)

    # Guardrails
    if "#ad" not in post_text.lower():
        post_text += "\n#ad"
    if affiliate_link not in post_text:
        lines = post_text.split("\n")
        lines.insert(1, affiliate_link)
        post_text = "\n".join(lines)

    return post_text.strip()
