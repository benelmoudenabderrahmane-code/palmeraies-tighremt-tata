import anthropic
from config.settings import get_settings

settings = get_settings()

STYLE_PROMPTS = {
    "best_deal": (
        "Write a Facebook deal post with '🛍️ BEST DEAL' energy. "
        "Use the opener: 🛍️*[STORE] BEST DEALS SAVE MONEY. LIVE BETTER !* 🛍️🚀"
    ),
    "price_drop": (
        "Write a Facebook deal post announcing a PRICE DROP 💥. "
        "Lead with price savings, create excitement about the discount."
    ),
    "limited_time": (
        "Write a Facebook deal post with 'LIMITED TIME DEAL ⏰🔥' urgency. "
        "Stress scarcity and time pressure."
    ),
    "top_rated": (
        "Write a Facebook deal post highlighting TOP RATED ⭐ status. "
        "Focus on social proof: ratings, reviews, popularity."
    ),
}


async def generate_deal_post(
    product_name: str,
    price: float,
    affiliate_link: str,
    style: str = "best_deal",
    original_price: float | None = None,
    network: str = "amazon",
) -> str:
    store = network.upper()
    discount_text = ""
    if original_price and original_price > price:
        discount_pct = int((original_price - price) / original_price * 100)
        discount_text = f" (was ${original_price:.2f} — SAVE {discount_pct}%!)"

    style_instruction = STYLE_PROMPTS.get(style, STYLE_PROMPTS["best_deal"])

    prompt = f"""{style_instruction}

Product: {product_name}
Store: {store}
Price: ${price:.2f}{discount_text}
Affiliate link: {affiliate_link}

RULES — follow exactly:
- Maximum 5 lines total
- Emoji-heavy throughout
- ALL CAPS for claims and action words
- The affiliate link must be on its own line (line 2)
- Final line must be exactly: #ad
- No extra commentary, just the post

Output only the post text."""

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    post_text = response.content[0].text.strip()

    # Ensure FTC compliance: #ad must be present
    if "#ad" not in post_text.lower():
        post_text += "\n#ad"

    # Ensure affiliate link is present
    if affiliate_link not in post_text:
        lines = post_text.split("\n")
        lines.insert(1, affiliate_link)
        post_text = "\n".join(lines)

    return post_text
