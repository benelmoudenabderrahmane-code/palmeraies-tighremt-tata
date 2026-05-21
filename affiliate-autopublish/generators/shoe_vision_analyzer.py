"""
Shoe Vision Analyzer
====================
Uses Groq llama-3.2-vision to analyze shoe photos and extract:
  - Brand, model, colorway
  - Materials (upper, sole)
  - Technology (Air, Boost, React, etc.)
  - Style (running / basketball / lifestyle / skate / etc.)
  - Best innovation to showcase

Returns a structured dict used by shoe_script_generator.
"""
import asyncio
import base64
import json
import re
from pathlib import Path

import httpx
from openai import AsyncOpenAI, RateLimitError, APIConnectionError
from config.settings import get_settings


def _make_groq_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=get_settings().groq_api_key,
        base_url="https://api.groq.com/openai/v1",
        http_client=httpx.AsyncClient(verify=False),
    )


def _encode_image(path: str) -> str:
    """Return base64-encoded image as data URL."""
    suffix = Path(path).suffix.lower()
    mime = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(suffix, "image/jpeg")
    data = Path(path).read_bytes()
    b64 = base64.b64encode(data).decode("utf-8")
    return f"data:{mime};base64,{b64}"


async def analyze_shoe_photos(photo_paths: list[str]) -> dict:
    """
    Analyze shoe photos with Groq vision.

    Returns:
    {
        "brand": "Nike",
        "model": "Air Max 270",
        "colorway": "Blanc / Noir / Or",
        "upper_material": "mesh + synthétique",
        "sole_technology": "Air Max 270 unité",
        "sole_material": "caoutchouc",
        "style": "lifestyle",
        "innovation": "squeeze test semelle",   ← chosen for the video
        "summary_line": "Nike Air Max 270 · Coloris: Blanc/Noir/Or · Matière: mesh · Technologie: Air Max",
        "best_photo_index": 0,   ← index of most impactful photo
        "hook_description": "semelle Air visible et translucide en gros plan",
    }
    """
    client = _make_groq_client()

    # Select up to 3 photos for vision analysis (API limit)
    selected = photo_paths[:3]
    if not selected:
        raise ValueError("No photos provided for analysis")

    # Build vision message content
    content = [
        {
            "type": "text",
            "text": """Tu es un expert sneaker. Analyse ces photos de chaussure et réponds en JSON strict.

Identifie: marque, modèle, coloris, matière upper, technologie semelle, matière semelle, style (running/basketball/lifestyle/skate/trail/tennis).

Choisis UNE innovation vidéo parmi: "squeeze test semelle" | "drop lent slow motion" | "rotation 360°" | "flex test" | "walk test" | "reveal progressif" | "night shot lampe torche"

Réponds UNIQUEMENT avec ce JSON (pas de texte avant/après):
{
  "brand": "...",
  "model": "...",
  "colorway": "...",
  "upper_material": "...",
  "sole_technology": "...",
  "sole_material": "...",
  "style": "...",
  "innovation": "...",
  "summary_line": "...",
  "best_photo_index": 0,
  "hook_description": "description du plan hook le plus impactant en 1 ligne"
}"""
        }
    ]

    for path in selected:
        try:
            data_url = _encode_image(path)
            content.append({
                "type": "image_url",
                "image_url": {"url": data_url}
            })
        except Exception:
            pass  # Skip unreadable images

    for attempt in range(3):
        try:
            resp = await client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                max_tokens=600,
                messages=[{"role": "user", "content": content}],
            )
            raw = resp.choices[0].message.content.strip()

            # Extract JSON from response
            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                # Ensure required fields exist
                result.setdefault("brand", "Unknown")
                result.setdefault("model", "Sneaker")
                result.setdefault("colorway", "")
                result.setdefault("upper_material", "mesh")
                result.setdefault("sole_technology", "")
                result.setdefault("sole_material", "caoutchouc")
                result.setdefault("style", "lifestyle")
                result.setdefault("innovation", "squeeze test semelle")
                result.setdefault("best_photo_index", 0)
                result.setdefault(
                    "summary_line",
                    f"{result['brand']} {result['model']} · Coloris: {result['colorway']} · Matière: {result['upper_material']} · Technologie: {result['sole_technology']}"
                )
                result.setdefault("hook_description", "gros plan semelle")
                return result

        except (RateLimitError, APIConnectionError):
            if attempt == 2:
                raise
            await asyncio.sleep(2 ** attempt)
        except json.JSONDecodeError:
            if attempt == 2:
                break  # Fall through to fallback

    # Fallback if vision fails
    return {
        "brand": "Sneaker",
        "model": "Edition",
        "colorway": "Coloris unique",
        "upper_material": "mesh",
        "sole_technology": "technologie exclusive",
        "sole_material": "caoutchouc",
        "style": "lifestyle",
        "innovation": "squeeze test semelle",
        "summary_line": "Sneaker Edition · Coloris unique · Matière: mesh",
        "best_photo_index": 0,
        "hook_description": "gros plan chaussure impactant",
    }
