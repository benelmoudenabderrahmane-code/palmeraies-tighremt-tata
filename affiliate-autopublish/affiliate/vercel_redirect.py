"""
Vercel Redirect Link Generator
==============================
Creates a Vercel-hosted redirect URL for any affiliate link.
YouTube/TikTok/IG always render *.vercel.app URLs as clickable links,
while raw howl.link / amazon affiliate URLs are often blocked.

For now, builds redirect entries in a static vercel.json file
inside affiliate-autopublish/vercel-redirects/.

In production, push this directory to Vercel via the CLI on a schedule,
or use Vercel REST API to update redirects live (see vercel_api_deploy()).
"""
import json
import logging
import os
import re
from pathlib import Path

logger = logging.getLogger(__name__)

REDIRECTS_DIR = Path(__file__).parent.parent / "vercel-redirects"
REDIRECTS_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_FILE = REDIRECTS_DIR / "vercel.json"
INDEX_FILE = REDIRECTS_DIR / "index.html"


def _slugify(text: str) -> str:
    """Convert product name to URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text[:40].strip("-")


def _load_config() -> dict:
    if CONFIG_FILE.exists():
        try:
            return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {"redirects": []}


def _save_config(config: dict) -> None:
    CONFIG_FILE.write_text(
        json.dumps(config, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def create_redirect(
    product_name: str,
    affiliate_link: str,
    project_domain: str = "nike-redirect.vercel.app",
) -> str:
    """
    Add a /product-slug → affiliate_link redirect entry.

    Returns the resulting Vercel URL (e.g. https://nike-redirect.vercel.app/airpods-pro)
    """
    slug = _slugify(product_name)
    if not slug:
        return f"https://{project_domain}"

    config = _load_config()

    # Remove any existing redirect for this slug
    config["redirects"] = [r for r in config["redirects"] if r.get("source") != f"/{slug}"]

    # Add the new one
    config["redirects"].append({
        "source": f"/{slug}",
        "destination": affiliate_link,
        "permanent": False,
    })

    # Also keep the root redirect (legacy) → first product as default
    has_root = any(r.get("source") == "/" for r in config["redirects"])
    if not has_root and config["redirects"]:
        config["redirects"].insert(0, {
            "source": "/",
            "destination": affiliate_link,
            "permanent": False,
        })

    _save_config(config)
    _ensure_index_html()

    url = f"https://{project_domain}/{slug}"
    logger.info("Vercel redirect created: %s -> %s", url, affiliate_link)
    return url


def _ensure_index_html() -> None:
    """Create a minimal index.html so Vercel has something to serve at /."""
    if INDEX_FILE.exists():
        return
    INDEX_FILE.write_text(
        "<!DOCTYPE html><html><head><title>Affiliate Redirects</title></head>"
        "<body><p>Click your product link.</p></body></html>",
        encoding="utf-8",
    )


def list_redirects() -> list[dict]:
    """Return all redirects currently configured."""
    return _load_config().get("redirects", [])


def deploy_to_vercel() -> str:
    """
    Trigger a `vercel --prod` deployment of the redirects directory.
    Returns the deployment URL or empty string on failure.
    Requires the Vercel CLI to be installed and authenticated.
    """
    import subprocess
    try:
        result = subprocess.run(
            ["vercel", "--prod", "--yes", str(REDIRECTS_DIR)],
            capture_output=True,
            text=True,
            timeout=120,
        )
        # Extract the production URL from output
        match = re.search(r"https://[\w-]+\.vercel\.app", result.stdout + result.stderr)
        if match:
            return match.group(0)
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        logger.warning("Vercel CLI deploy failed: %s", exc)
    return ""
