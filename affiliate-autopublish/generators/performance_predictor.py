"""
Performance Predictor
=====================
Heuristic + AI scoring of a video's viral potential BEFORE publishing.

Combines:
  • Title length & punch (60-70 chars optimal for YouTube)
  • Hook strength (presence of curiosity gap, urgency, numbers)
  • Hashtag pyramid quality (mix of high/mid/low volume)
  • Product niche fit (trending vs evergreen)
  • Caption engagement signals (questions, emojis, CTA)
  • Affiliate link prominence

Returns a 0-100 score + actionable improvements.
"""
import re
from collections import Counter


# Words known to increase CTR on YouTube/TikTok/IG
POWER_WORDS = {
    "secret", "trick", "trucs", "incroyable", "shocking", "viral",
    "best", "meilleur", "top", "ultimate", "essential", "must",
    "new", "nouveau", "2026", "this", "ce", "découverte",
    "review", "test", "essai", "comparison", "vs",
    "why", "pourquoi", "how", "comment", "what", "quoi",
    "free", "gratuit", "discount", "promo", "deal",
}

URGENCY_WORDS = {
    "now", "maintenant", "today", "aujourd'hui", "quick", "rapide",
    "limited", "limité", "stock", "fast", "rapide",
}

NUMBER_PATTERN = re.compile(r"\b\d+\b")
EMOJI_PATTERN = re.compile(
    "[\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F700-\U0001F77F"
    "\U0001F780-\U0001F7FF"
    "\U0001F800-\U0001F8FF"
    "\U0001F900-\U0001F9FF"
    "\U0001FA00-\U0001FA6F"
    "\U0001FA70-\U0001FAFF"
    "☀-⛿✀-➿]+",
    flags=re.UNICODE,
)


def _score_title(title: str) -> dict:
    """Score the YouTube title (0-25)."""
    title_lower = title.lower()
    length = len(title)

    # Length sweet spot: 50-70 chars
    if 50 <= length <= 70:
        length_score = 10
    elif 40 <= length < 50 or 70 < length <= 85:
        length_score = 7
    elif length > 100:
        length_score = 2
    else:
        length_score = 5

    # Power words
    pw_hits = sum(1 for w in POWER_WORDS if w in title_lower)
    pw_score = min(pw_hits * 2, 6)

    # Numbers (specific numbers boost CTR)
    num_score = 3 if NUMBER_PATTERN.search(title) else 0

    # Emoji (1-2 optimal, more is spammy)
    emoji_count = len(EMOJI_PATTERN.findall(title))
    if 1 <= emoji_count <= 2:
        emoji_score = 3
    elif emoji_count > 5:
        emoji_score = -2
    else:
        emoji_score = 0

    # Has #Shorts tag (for Shorts placement)
    shorts_score = 3 if "#shorts" in title_lower else 0

    total = max(0, length_score + pw_score + num_score + emoji_score + shorts_score)
    return {
        "score": min(total, 25),
        "length": length,
        "power_words": pw_hits,
        "has_numbers": bool(NUMBER_PATTERN.search(title)),
        "emoji_count": emoji_count,
        "has_shorts_tag": "#shorts" in title_lower,
    }


def _score_caption(caption: str) -> dict:
    """Score the caption (0-20)."""
    if not caption:
        return {"score": 0, "issues": ["Empty caption"]}

    cap_lower = caption.lower()
    length = len(caption)
    score = 0
    issues = []

    # Has affiliate link?
    has_link = any(x in cap_lower for x in ["http", "vercel.app", "howl.link", "amzn"])
    score += 5 if has_link else 0
    if not has_link:
        issues.append("No affiliate link in caption")

    # Has question (engagement)
    if "?" in caption:
        score += 3

    # Has CTA verbs
    cta_words = ["click", "tap", "swipe", "shop", "buy", "click", "découvre", "achète", "lien"]
    if any(w in cap_lower for w in cta_words):
        score += 4

    # Power words
    pw_hits = sum(1 for w in POWER_WORDS if w in cap_lower)
    score += min(pw_hits, 4)

    # Length sweet spot
    if 150 <= length <= 800:
        score += 4
    elif length < 50:
        issues.append("Caption too short (<50 chars)")
    elif length > 2000:
        issues.append("Caption too long (>2000 chars)")

    return {
        "score": min(score, 20),
        "length": length,
        "has_link": has_link,
        "issues": issues,
    }


def _score_hashtags(hashtags: list[str]) -> dict:
    """Score hashtag strategy (0-20)."""
    if not hashtags:
        return {"score": 0, "issues": ["No hashtags"]}

    n = len(hashtags)
    score = 0
    issues = []

    # Sweet spot for IG: 20-30, TikTok: 5-10
    if 20 <= n <= 30:
        score += 8
    elif 5 <= n < 20:
        score += 6
    elif n < 5:
        score += 2
        issues.append(f"Only {n} hashtags (recommend 5+)")

    # Mix of generic + niche
    generic_tags = {"#fyp", "#viral", "#foryou", "#reels", "#shorts", "#instagood"}
    has_generic = any(t.lower() in generic_tags for t in hashtags)
    score += 4 if has_generic else 0
    if not has_generic:
        issues.append("No generic boost tags (#fyp, #viral)")

    # Diversity (no duplicates)
    unique = len(set(t.lower() for t in hashtags))
    if unique == n:
        score += 4
    else:
        issues.append("Duplicate hashtags")

    # Length variety (short + medium + long tags)
    lengths = Counter(len(t) for t in hashtags)
    if len(lengths) >= 3:
        score += 4

    return {
        "score": min(score, 20),
        "count": n,
        "has_generic": has_generic,
        "issues": issues,
    }


def _score_niche_fit(niche: str, product_name: str) -> dict:
    """Score how trending/marketable the niche is (0-15)."""
    hot_niches = {"shoes", "tech_gadgets", "beauty", "fitness", "electronics"}
    warm_niches = {"home", "fashion", "sports"}

    n = niche.lower() if niche else ""
    if n in hot_niches:
        score = 15
    elif n in warm_niches:
        score = 10
    elif n:
        score = 6
    else:
        score = 3

    return {"score": score, "niche": n or "unknown"}


def _score_visual_signals(features: list[str]) -> dict:
    """Score the product info quality (0-20)."""
    if not features:
        return {"score": 5, "issues": ["No features listed"]}

    score = 0
    if len(features) >= 3:
        score += 8
    elif len(features) >= 1:
        score += 5

    # Specificity bonus
    avg_len = sum(len(f) for f in features) / len(features)
    if 15 <= avg_len <= 60:
        score += 6
    elif avg_len < 8:
        score += 2

    # Numbers/specs (model numbers, sizes, etc)
    spec_hits = sum(1 for f in features if NUMBER_PATTERN.search(f))
    score += min(spec_hits * 2, 6)

    return {"score": min(score, 20), "feature_count": len(features)}


def predict_performance(
    title: str,
    caption: str,
    hashtags: list[str],
    niche: str = "",
    product_name: str = "",
    features: list[str] | None = None,
) -> dict:
    """
    Predict viral performance of a planned post.

    Returns:
    {
      "score": 87,
      "grade": "A",
      "verdict": "High viral potential",
      "breakdown": {
        "title":    {"score": 23, "max": 25, ...},
        "caption":  {"score": 18, "max": 20, ...},
        "hashtags": {...},
        "niche":    {...},
        "visual":   {...},
      },
      "improvements": [...actionable tips...]
    }
    """
    title_r    = _score_title(title or "")
    caption_r  = _score_caption(caption or "")
    hashtag_r  = _score_hashtags(hashtags or [])
    niche_r    = _score_niche_fit(niche, product_name)
    visual_r   = _score_visual_signals(features or [])

    total = (title_r["score"] + caption_r["score"] + hashtag_r["score"]
             + niche_r["score"] + visual_r["score"])

    if total >= 80:
        grade, verdict = "A", "🔥 High viral potential — publish now"
    elif total >= 65:
        grade, verdict = "B", "✅ Solid — should perform well"
    elif total >= 50:
        grade, verdict = "C", "⚠️ Average — improvements suggested"
    else:
        grade, verdict = "D", "🔴 Low potential — rework before publish"

    improvements = []
    for r in [title_r, caption_r, hashtag_r]:
        improvements.extend(r.get("issues", []))
    if title_r["score"] < 15:
        improvements.append("Title too short or weak — add power words or numbers")
    if not caption_r.get("has_link"):
        improvements.append("Add affiliate link in caption")
    if hashtag_r.get("count", 0) < 5:
        improvements.append("Add at least 5 hashtags")

    return {
        "score": total,
        "grade": grade,
        "verdict": verdict,
        "breakdown": {
            "title": {**title_r, "max": 25},
            "caption": {**caption_r, "max": 20},
            "hashtags": {**hashtag_r, "max": 20},
            "niche": {**niche_r, "max": 15},
            "visual": {**visual_r, "max": 20},
        },
        "improvements": improvements[:6],
    }
