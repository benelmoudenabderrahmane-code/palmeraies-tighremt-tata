"""
System Health Check
===================
Verify each integration is correctly configured before publish attempts.

Exposes a single `check_all_systems()` that returns the status of:
  • Groq API (SEO generation)
  • YouTube OAuth2 token
  • Meta access token (IG + FB)
  • TikTok refresh token
  • Vercel CLI / redirect files
  • FFmpeg installation
  • Database connection
"""
import logging
import shutil
import subprocess
from pathlib import Path

from config.settings import get_settings

logger = logging.getLogger(__name__)


def check_groq() -> dict:
    settings = get_settings()
    ok = bool(settings.groq_api_key and settings.groq_api_key.startswith("gsk_"))
    return {
        "service": "groq",
        "ok": ok,
        "message": "Ready" if ok else "GROQ_API_KEY missing or invalid format",
    }


def check_youtube() -> dict:
    token_file = Path(__file__).parent.parent / "youtube_token.pickle"
    ok = token_file.exists()
    return {
        "service": "youtube",
        "ok": ok,
        "message": "OAuth2 token loaded" if ok else "Run python upload_youtube.py to authenticate",
    }


def check_meta() -> dict:
    settings = get_settings()
    ok = bool(settings.meta_user_access_token)
    fields = {
        "META_USER_ACCESS_TOKEN": bool(settings.meta_user_access_token),
        "META_INSTAGRAM_ACCOUNT_ID": bool(settings.meta_instagram_account_id),
        "META_PAGE_ID": bool(settings.meta_page_id),
        "META_GROUP_ID": bool(settings.meta_group_id),
    }
    missing = [k for k, v in fields.items() if not v]
    return {
        "service": "meta",
        "ok": ok,
        "message": "All Meta fields set" if ok and not missing else f"Missing: {', '.join(missing)}",
        "fields": fields,
    }


def check_tiktok() -> dict:
    settings = get_settings()
    fields = {
        "TIKTOK_CLIENT_KEY": bool(settings.tiktok_client_key),
        "TIKTOK_CLIENT_SECRET": bool(settings.tiktok_client_secret),
        "TIKTOK_REFRESH_TOKEN": bool(settings.tiktok_refresh_token),
    }
    ok = all(fields.values())
    missing = [k for k, v in fields.items() if not v]
    return {
        "service": "tiktok",
        "ok": ok,
        "message": "All TikTok fields set" if ok else f"Missing: {', '.join(missing)}",
        "fields": fields,
    }


def check_vercel() -> dict:
    redirects_dir = Path(__file__).parent.parent / "vercel-redirects"
    vercel_json = redirects_dir / "vercel.json"
    cli_available = shutil.which("vercel") is not None or shutil.which("npx") is not None

    if vercel_json.exists():
        import json
        try:
            data = json.loads(vercel_json.read_text(encoding="utf-8"))
            count = len(data.get("redirects", []))
            return {
                "service": "vercel",
                "ok": True,
                "message": f"{count} redirects configured (CLI {'available' if cli_available else 'missing'})",
                "redirect_count": count,
            }
        except Exception:
            pass
    return {
        "service": "vercel",
        "ok": False,
        "message": "vercel-redirects/ not initialized — first create_redirect() will bootstrap",
    }


def check_ffmpeg() -> dict:
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            first_line = result.stdout.split("\n", 1)[0]
            return {"service": "ffmpeg", "ok": True, "message": first_line[:80]}
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    return {"service": "ffmpeg", "ok": False, "message": "ffmpeg not in PATH"}


async def check_database() -> dict:
    try:
        from database.crud import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
        return {"service": "database", "ok": True, "message": "SQLite ready"}
    except Exception as exc:
        return {"service": "database", "ok": False, "message": str(exc)[:120]}


async def check_all_systems() -> dict:
    """
    Run all health checks and return aggregated status.

    Returns:
    {
      "ready_for_publish": ["youtube"],
      "needs_setup":       ["meta", "tiktok"],
      "broken":            [],
      "checks": [...all individual results...]
    }
    """
    sync_checks = [
        check_groq(),
        check_youtube(),
        check_meta(),
        check_tiktok(),
        check_vercel(),
        check_ffmpeg(),
    ]
    db_check = await check_database()
    all_checks = sync_checks + [db_check]

    ready: list[str] = []
    needs: list[str] = []
    for c in all_checks:
        if c["ok"]:
            ready.append(c["service"])
        else:
            needs.append(c["service"])

    return {
        "ready_for_publish": ready,
        "needs_setup": needs,
        "checks": all_checks,
    }
