"""
Shoe Script Generator
=====================
Takes a shoe vision analysis + affiliate link → generates a complete 30-second
YouTube Short script with 5 timed segments, YouTube description, and Canva brief.

Segment structure (30 sec):
  [0–3s]   Hook        — plan choc + nom modèle
  [3–10s]  Unboxing    — boîte + papier soie + profil + semelle
  [10–22s] Gros plans  — logo + flex/squeeze + matière + innovation
  [22–27s] On feet     — enfile + walk test
  [27–30s] CTA         — silence + lien

Returns:
{
  "product_line": "...",
  "innovation": "...",
  "segments": [
    {
      "id": "hook",
      "label": "HOOK",
      "start": 0, "end": 3,
      "description": "...",
      "sound": "...",
      "overlay": "Nike Air Max 270",
      "photo_hint": "best_hero"   ← which photo to use
    },
    ...
  ],
  "youtube_description": "...",
  "canva_brief": "...",
  "pinned_comment": "...",
}
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


async def _groq_chat(messages: list, max_tokens: int = 1200) -> str:
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
    raise RuntimeError("Groq unreachable")


async def generate_shoe_script(
    vision: dict,
    affiliate_link: str,
    website_url: str = "",
    howl_channel_url: str = "",
) -> dict:
    """
    Generate complete 30-sec YouTube Short script from vision analysis.

    Args:
        vision:          output of shoe_vision_analyzer.analyze_shoe_photos()
        affiliate_link:  Howl/Amazon/etc. affiliate URL
        website_url:     your website (optional)
        howl_channel_url: Howl channel page (optional)

    Returns:
        Full script dict (see module docstring)
    """
    brand = vision.get("brand", "Brand")
    model = vision.get("model", "Model")
    colorway = vision.get("colorway", "")
    upper_material = vision.get("upper_material", "mesh")
    sole_tech = vision.get("sole_technology", "")
    style = vision.get("style", "lifestyle")
    innovation = vision.get("innovation", "squeeze test semelle")

    prompt = f"""Tu es un directeur créatif expert YouTube Shorts sneakers.

PRODUIT ANALYSÉ:
- {brand} {model}
- Coloris: {colorway}
- Upper: {upper_material}
- Technologie semelle: {sole_tech}
- Style: {style}
- Innovation choisie pour la vidéo: {innovation}

RÈGLES ABSOLUES:
- Style ASMR visuel. SANS parole. SANS musique. Sons naturels uniquement.
- Un homme interagit avec la chaussure (mains, pieds, jambes — pas de visage).
- Exactement 30 secondes. 5 segments fixes.
- Les textes overlay doivent être COURTS (max 4 mots) et percutants.

Génère le script en JSON strict (pas de texte autour):

{{
  "segments": [
    {{
      "id": "hook",
      "label": "HOOK",
      "start": 0,
      "end": 3,
      "description": "Description précise du plan filmé (1-2 phrases)",
      "sound": "Son naturel décrit",
      "overlay": "Texte overlay court (max 4 mots)",
      "photo_hint": "hero"
    }},
    {{
      "id": "unboxing",
      "label": "UNBOXING",
      "start": 3,
      "end": 10,
      "description": "Description précise du plan filmé",
      "sound": "Sons: carton, froissement papier de soie",
      "overlay": "{colorway} · {sole_tech}",
      "photo_hint": "side_and_sole"
    }},
    {{
      "id": "closeups",
      "label": "GROS PLANS",
      "start": 10,
      "end": 22,
      "description": "Série de gros plans: logo marque, {innovation}, upper {upper_material}, lacets",
      "sound": "Sons: doigt sur matière, compression mousse, lacet",
      "overlay": "{upper_material} · {sole_tech}",
      "photo_hint": "detail_shots"
    }},
    {{
      "id": "onfeet",
      "label": "ON FEET",
      "start": 22,
      "end": 27,
      "description": "Homme enfile la chaussure, walk test 2-3 pas vue de côté niveau sol",
      "sound": "Chaque pas audible sur le sol",
      "overlay": "Taille testée · {style}",
      "photo_hint": "on_feet"
    }},
    {{
      "id": "cta",
      "label": "CTA",
      "start": 27,
      "end": 30,
      "description": "Chaussure seule en plan large, silence total, cut sec au noir",
      "sound": "Silence",
      "overlay": "Lien en description",
      "photo_hint": "hero"
    }}
  ]
}}

Personnalise les descriptions pour {brand} {model} avec {innovation}. Sois précis et cinématique."""

    raw = await _groq_chat([{"role": "user", "content": prompt}], max_tokens=1000)

    # Parse segments
    segments = []
    json_match = re.search(r'\{.*\}', raw, re.DOTALL)
    if json_match:
        try:
            parsed = json.loads(json_match.group())
            segments = parsed.get("segments", [])
        except json.JSONDecodeError:
            pass

    # Fallback segments if parsing fails
    if not segments:
        segments = _default_segments(brand, model, colorway, sole_tech, upper_material, style, innovation)

    # Generate YouTube description
    yt_desc = _build_youtube_description(
        brand, model, colorway, sole_tech, upper_material, style,
        affiliate_link, website_url, howl_channel_url
    )

    # Build Canva brief
    canva_brief = (
        f"Miniature YouTube Shorts : fond noir mat. "
        f"Chaussure {brand} {model} en {colorway} en gros plan haute définition, "
        f"légèrement en diagonale. Texte '{brand.upper()} {model.upper()}' en blanc gras "
        f"côté gauche. Badge prix ou technologie '{sole_tech}' en or. Style épuré, luxe streetwear."
    )

    return {
        "product_line": f"Produit identifié : {brand} {model} · Coloris : {colorway} · Matière : {upper_material} · Technologie : {sole_tech}",
        "innovation": innovation,
        "brand": brand,
        "model": model,
        "colorway": colorway,
        "segments": segments,
        "youtube_description": yt_desc,
        "canva_brief": canva_brief,
        "pinned_comment": affiliate_link,
    }


def _default_segments(brand, model, colorway, sole_tech, upper_material, style, innovation) -> list:
    return [
        {
            "id": "hook", "label": "HOOK", "start": 0, "end": 3,
            "description": f"Gros plan choc sur la semelle {sole_tech or 'unique'}, lumière rasante qui fait briller la chaussure.",
            "sound": "Silence — impact visuel",
            "overlay": f"{brand} {model}",
            "photo_hint": "hero",
        },
        {
            "id": "unboxing", "label": "UNBOXING", "start": 3, "end": 10,
            "description": "Mains sortent la chaussure d'une boîte, papier de soie froisse, profil gauche puis semelle vue dessous.",
            "sound": "Carton s'ouvre, froissement papier de soie",
            "overlay": f"{colorway} · {sole_tech}" if sole_tech else colorway,
            "photo_hint": "side_and_sole",
        },
        {
            "id": "closeups", "label": "GROS PLANS", "start": 10, "end": 22,
            "description": f"Logo marque · {innovation} · upper {upper_material} · lacets dénoués puis renoués.",
            "sound": "Doigt glisse sur matière, compression mousse, claquement lacet",
            "overlay": f"{upper_material} · {sole_tech}" if sole_tech else upper_material,
            "photo_hint": "detail_shots",
        },
        {
            "id": "onfeet", "label": "ON FEET", "start": 22, "end": 27,
            "description": "Homme enfile la chaussure lentement, walk test 2-3 pas vue de côté niveau sol.",
            "sound": "Chaque pas audible",
            "overlay": f"Sport · {style.title()}",
            "photo_hint": "on_feet",
        },
        {
            "id": "cta", "label": "CTA", "start": 27, "end": 30,
            "description": "Chaussure seule centrée, silence absolu, cut sec au noir.",
            "sound": "Silence",
            "overlay": "Lien en description",
            "photo_hint": "hero",
        },
    ]


def _build_youtube_description(
    brand, model, colorway, sole_tech, upper_material, style,
    affiliate_link, website_url, howl_channel_url
) -> str:
    lines = [
        f"👟 Acheter ici → {affiliate_link}",
    ]
    if website_url:
        lines.append(f"🌐 Notre site → {website_url}")
    if howl_channel_url:
        lines.append(f"📦 Tous nos produits → {howl_channel_url}")
    lines += [
        "",
        f"🔎 Dans cette vidéo : {brand} · {model} · {colorway} · {sole_tech or upper_material}",
        "",
        "#sneakers #running #unboxing #kicks #chaussures #sneakerhead",
        f"#{brand.lower().replace(' ', '')} #{model.lower().replace(' ', '')} #{style}",
    ]
    return "\n".join(lines)
