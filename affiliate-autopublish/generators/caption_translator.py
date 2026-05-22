"""
Multi-Language Caption Translator
==================================
Translates captions, titles, and descriptions across languages
using Groq Llama (zero cost). Lets the system publish the same video
to French, English, Spanish, German, Arabic audiences.

Supported targets: en, fr, es, de, ar, pt, it, ja
"""
import asyncio
import logging

import httpx
from openai import AsyncOpenAI, RateLimitError, APIConnectionError

from config.settings import get_settings

logger = logging.getLogger(__name__)

LANG_NAMES = {
    "fr": "French",
    "en": "English",
    "es": "Spanish",
    "de": "German",
    "ar": "Arabic",
    "pt": "Portuguese",
    "it": "Italian",
    "ja": "Japanese",
}


def _client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=get_settings().groq_api_key,
        base_url="https://api.groq.com/openai/v1",
        http_client=httpx.AsyncClient(verify=False),
    )


async def translate_text(
    text: str,
    target_lang: str = "en",
    source_lang: str = "fr",
    style: str = "social media",
) -> str:
    """
    Translate text into the target language with style awareness.

    Args:
        text:        source text
        target_lang: ISO code (en, es, de…)
        source_lang: ISO code of original
        style:       'social media' | 'professional' | 'casual'

    Returns:
        Translated text, preserving hashtags and emojis.
    """
    if not text.strip() or target_lang == source_lang:
        return text

    target_name = LANG_NAMES.get(target_lang, target_lang)
    source_name = LANG_NAMES.get(source_lang, source_lang)

    prompt = f"""Translate this {source_name} text into {target_name} for {style} content.
Keep all hashtags (#xxx) AND emojis intact. Keep the same energy and tone.
Do not add quotes around your output. Output ONLY the translated text.

Source: {text}

Translation:"""

    client = _client()
    for attempt in range(3):
        try:
            resp = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                max_tokens=min(2000, len(text) * 3),
                messages=[{"role": "user", "content": prompt}],
            )
            return resp.choices[0].message.content.strip().strip('"').strip("'")
        except (RateLimitError, APIConnectionError):
            if attempt == 2:
                logger.warning("Translation to %s failed after 3 attempts", target_lang)
                return text
            await asyncio.sleep(2 ** attempt)
    return text


async def translate_seo_bundle(
    seo: dict,
    target_languages: list[str],
    source_lang: str = "fr",
) -> dict:
    """
    Translate the entire SEO bundle into multiple languages.

    Returns:
    {
      "fr": original_seo,
      "en": {...same structure, translated},
      "es": {...},
    }
    """
    result = {source_lang: seo}
    tasks = []
    for lang in target_languages:
        if lang == source_lang:
            continue
        tasks.append(_translate_bundle(seo, lang, source_lang))

    translated = await asyncio.gather(*tasks, return_exceptions=False)
    for lang, bundle in zip([l for l in target_languages if l != source_lang], translated):
        result[lang] = bundle

    return result


async def _translate_bundle(seo: dict, target_lang: str, source_lang: str) -> dict:
    """Translate every text field in a SEO bundle."""
    out = {}

    # YouTube
    out["youtube"] = {
        "title":       await translate_text(seo["youtube"]["title"], target_lang, source_lang),
        "description": await translate_text(seo["youtube"]["description"], target_lang, source_lang),
        "tags":        seo["youtube"]["tags"],  # tags often work cross-language
    }

    # TikTok
    out["tiktok"] = {
        "caption":  await translate_text(seo["tiktok"]["caption"], target_lang, source_lang),
        "hashtags": seo["tiktok"]["hashtags"],
    }

    # Instagram
    out["instagram"] = {
        "caption":  await translate_text(seo["instagram"]["caption"], target_lang, source_lang),
        "hashtags": seo["instagram"]["hashtags"],
    }

    # Facebook
    out["facebook"] = {
        "post_text":           await translate_text(seo["facebook"]["post_text"], target_lang, source_lang),
        "link_preview_title":  await translate_text(seo["facebook"]["link_preview_title"], target_lang, source_lang),
    }

    out["shared"] = seo.get("shared", {})
    return out
