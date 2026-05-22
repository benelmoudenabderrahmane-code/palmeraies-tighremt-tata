"""
Multi-Platform SEO Generator
============================
Generates platform-optimized SEO for a single product across:
  • YouTube Shorts  → title (100 chars) + description + 15 tags
  • TikTok          → caption (150 chars) + 10 trending hashtags
  • Instagram Reels → caption (2200 chars) + 30 hashtags
  • Facebook        → post text + clickable affiliate link

Returns a dict where each platform has its own optimized payload.
Uses Groq llama-3.3-70b-versatile (fast, free tier).
"""
import asyncio
import json
import re

import httpx
from openai import AsyncOpenAI, RateLimitError, APIConnectionError
from config.settings import get_settings


def _make_groq_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=get_settings().groq_api_key,
        base_url="https://api.groq.com/openai/v1",
        http_client=httpx.AsyncClient(verify=False),
    )


async def _groq_json(prompt: str, max_tokens: int = 800) -> dict:
    """Call Groq and parse the JSON object from the response."""
    client = _make_groq_client()
    for attempt in range(3):
        try:
            resp = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = resp.choices[0].message.content.strip()
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
        except (RateLimitError, APIConnectionError):
            if attempt == 2:
                raise
            await asyncio.sleep(2 ** attempt)
        except json.JSONDecodeError:
            if attempt == 2:
                break
    return {}


async def generate_multi_platform_seo(
    product_name: str,
    affiliate_link: str,
    niche: str = "",
    price: float = 0.0,
    features: list[str] | None = None,
    target_audience: str = "general",
) -> dict:
    """
    Generate optimized SEO bundle for all 4 platforms.

    Returns:
    {
      "youtube":   {"title": "...", "description": "...", "tags": [...]},
      "tiktok":    {"caption": "...", "hashtags": [...]},
      "instagram": {"caption": "...", "hashtags": [...]},
      "facebook":  {"post_text": "...", "link_preview_title": "..."},
      "shared":    {"affiliate_link": "...", "niche": "..."}
    }
    """
    features_str = " | ".join(features or [])
    prompt = f"""Tu es un expert affiliate marketer multi-plateforme.
Produit: {product_name}
Niche: {niche or "general"}
Prix: {price}EUR
Caracteristiques: {features_str}
Audience: {target_audience}
Lien affiliate: {affiliate_link}

Genere le SEO optimal pour CHAQUE plateforme. JSON strict (pas de texte autour):

{{
  "youtube": {{
    "title": "Titre punchy 60-95 chars incluant #Shorts et le mot-cle principal",
    "description": "Description avec lien affiliate en premiere ligne, hook, benefices, hashtags - 300-500 chars",
    "tags": ["tag1", "tag2", ...15 tags pertinents]
  }},
  "tiktok": {{
    "caption": "Caption 100-150 chars avec hook fort + CTA + lien si possible",
    "hashtags": ["#fyp", "#viral", "#mainHashtag", ...10 hashtags trending dans la niche]
  }},
  "instagram": {{
    "caption": "Caption Instagram 800-1500 chars avec storytelling, emojis, paragraphes courts, CTA et lien affiliate",
    "hashtags": ["#mainTag", "#nicheTag", ...30 hashtags mix high/mid/low volume]
  }},
  "facebook": {{
    "post_text": "Post Facebook 200-400 chars conversationnel avec hook, valeur, lien affiliate en clair (pas raccourci)",
    "link_preview_title": "Titre court accrocheur pour la preview du lien"
  }}
}}

REGLES:
- YouTube tags: 1 mot-cle principal + variations longue traine + niche
- TikTok hashtags: melange #fyp #viral #foryou + niche specifique trending
- Instagram hashtags: pyramide (5 gros + 15 moyens + 10 petits)
- Facebook: AUCUN raccourci de lien, le lien complet en clair pour qu'il soit cliquable
- Tout en francais, ton authentique, pas marketing-bullshit
- Inclure des emojis pertinents (pas trop)
"""

    result = await _groq_json(prompt, max_tokens=1500)

    # Fallback if parsing fails
    if not result or "youtube" not in result:
        result = _fallback_seo(product_name, affiliate_link, niche)

    # Ensure required keys exist
    result.setdefault("youtube", {})
    result["youtube"].setdefault("title", f"{product_name} #Shorts"[:100])
    result["youtube"].setdefault("description", f"{affiliate_link}\n\n{product_name}\n\n#Shorts")
    result["youtube"].setdefault("tags", [niche, "Shorts", product_name.split()[0]] if niche else ["Shorts"])

    result.setdefault("tiktok", {})
    result["tiktok"].setdefault("caption", f"{product_name} {affiliate_link}"[:150])
    result["tiktok"].setdefault("hashtags", ["#fyp", "#viral", f"#{niche.replace(' ', '')}"] if niche else ["#fyp", "#viral"])

    result.setdefault("instagram", {})
    result["instagram"].setdefault("caption", f"{product_name}\n\nLien: {affiliate_link}")
    result["instagram"].setdefault("hashtags", ["#reels", "#viral", f"#{niche.replace(' ', '')}"] if niche else ["#reels"])

    result.setdefault("facebook", {})
    result["facebook"].setdefault("post_text", f"{product_name}\n\n{affiliate_link}")
    result["facebook"].setdefault("link_preview_title", product_name[:60])

    result["shared"] = {
        "affiliate_link": affiliate_link,
        "niche": niche,
        "product_name": product_name,
    }

    return result


def _fallback_seo(product_name: str, affiliate_link: str, niche: str) -> dict:
    """Hard-coded fallback when Groq fails."""
    safe_niche = niche.replace(" ", "")
    first_word = product_name.split()[0] if product_name else "product"
    return {
        "youtube": {
            "title": f"{product_name[:80]} #Shorts",
            "description": f"{affiliate_link}\n\n{product_name}\n\n#Shorts #{safe_niche} #{first_word}",
            "tags": [first_word, safe_niche, "Shorts", "review", "trending", product_name],
        },
        "tiktok": {
            "caption": f"{product_name[:100]} {affiliate_link}"[:150],
            "hashtags": ["#fyp", "#viral", "#foryou", f"#{safe_niche}", f"#{first_word}",
                          "#review", "#trending", "#tiktokmademebuyit", "#ad", "#shopping"],
        },
        "instagram": {
            "caption": f"{product_name}\n\nLien en premier commentaire ou bio\n\n{affiliate_link}",
            "hashtags": [f"#{safe_niche}", f"#{first_word}", "#reels", "#viral", "#trending",
                          "#review", "#shopping", "#ad", "#fyp", "#instagood"] * 3,
        },
        "facebook": {
            "post_text": f"Decouverte du jour : {product_name}\n\n{affiliate_link}\n\nQu'en pensez-vous ?",
            "link_preview_title": product_name[:60],
        },
        "shared": {
            "affiliate_link": affiliate_link,
            "niche": niche,
            "product_name": product_name,
        },
    }
