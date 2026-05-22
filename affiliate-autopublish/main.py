import asyncio
import json
import logging
import shutil
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

import httpx
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession

from affiliate.click_tracker import handle_redirect
from affiliate.link_manager import generate_affiliate_link
from auth.security import rate_limit_redirect, require_auth
from config.logging_config import setup_logging
from config.settings import get_settings
from database.crud import (
    AsyncSessionLocal,
    create_job,
    create_post,
    get_clicks_by_network,
    get_posts,
    get_posts_by_platform,
    get_product,
    get_products,
    create_product,
    get_session,
    init_db,
    update_job,
)
from database.models import Post
from jobs.queue import job_queue
from jobs.worker import run_deal_post_campaign, run_full_video_campaign, run_shoe_short_campaign, run_multi_platform_publish
from scrapers.amazon_trending import discover_trending_products, get_daily_picks, CATEGORIES
from affiliate.vercel_redirect import create_redirect, list_redirects
from generators.multi_platform_seo import generate_multi_platform_seo
from scheduler.auto_post import setup_scheduler, start_scheduler
from scrapers.amazon import scrape_amazon
from scrapers.generic import scrape_generic

settings = get_settings()
setup_logging()
logger = logging.getLogger(__name__)

# Ensure media dir exists at startup
Path("media").mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting affiliate-autopublish")
    _validate_settings()
    await init_db()
    asyncio.create_task(job_queue.run_worker())
    setup_scheduler()
    start_scheduler()
    logger.info("Startup complete")
    yield
    logger.info("Shutting down")


def _validate_settings() -> None:
    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY not set — AI generation (scripts, deal posts) will fail")
    if not settings.dashboard_password:
        logger.warning("DASHBOARD_PASSWORD not set — using default (insecure)")


app = FastAPI(
    title="Affiliate AutoPublish",
    lifespan=lifespan,
    # Auth applied per-route; OpenAPI docs also protected.
    dependencies=[],
)
app.mount("/static", StaticFiles(directory="dashboard/static"), name="static")
app.mount("/media", StaticFiles(directory="media"), name="media")
templates = Jinja2Templates(directory="dashboard/templates")

# Protected = require Basic Auth. /go/{id} stays open (rate-limited).
PROTECTED = [Depends(require_auth)]


# ── Dashboard ──────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse, dependencies=PROTECTED)
async def dashboard(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Styled glassmorphism sign-in screen. Browser Basic Auth still gates /."""
    return templates.TemplateResponse(request, "login.html")


# ── Scrape ─────────────────────────────────────────────────────────────────────

@app.post("/api/scrape", dependencies=PROTECTED)
async def scrape_product(url: str = Form(...), session: AsyncSession = Depends(get_session)):
    url = url.strip()
    if "amazon." in url:
        data = await scrape_amazon(url)
    else:
        data = await scrape_generic(url)

    product = await create_product(
        session,
        name=data["name"],
        brand=data.get("brand", ""),
        price=data["price"],
        original_price=data.get("original_price", data["price"]),
        discount_pct=data.get("discount_pct", 0.0),
        description=data.get("description", ""),
        features=json.dumps(data.get("features", [])),
        images=json.dumps(data.get("images", [])),
        star_rating=data.get("star_rating", 0.0),
        review_count=data.get("review_count", 0),
        url=url,
    )

    return {
        "product": {
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "price": product.price,
            "original_price": product.original_price,
            "discount_pct": product.discount_pct,
            "images": json.loads(product.images or "[]"),
            "features": json.loads(product.features or "[]"),
            "description": product.description,
            "star_rating": product.star_rating,
            "review_count": product.review_count,
        }
    }


# ── Products ───────────────────────────────────────────────────────────────────

@app.get("/api/products", dependencies=PROTECTED)
async def list_products(session: AsyncSession = Depends(get_session)):
    products = await get_products(session)
    return {
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "url": p.url,
                "images": json.loads(p.images or "[]"),
                "created_at": str(p.created_at),
            }
            for p in products
        ]
    }


# ── Affiliate Links ─────────────────────────────────────────────────────────────

@app.post("/api/affiliate/generate", dependencies=PROTECTED)
async def gen_affiliate(
    product_id: int = Form(...),
    network: str = Form(...),
    custom_link: str = Form(""),
    session: AsyncSession = Depends(get_session),
):
    product = await get_product(session, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    redirect_url = await generate_affiliate_link(
        session, product_id, product.url, network, custom_link or None
    )
    return {"redirect_url": redirect_url}


@app.get("/go/{rid}")
async def click_redirect(
    rid: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(rate_limit_redirect),
):
    # NOT auth-protected (affiliate links must work from anywhere) but rate-limited.
    return await handle_redirect(rid, request, session)


# ── Video Campaign ──────────────────────────────────────────────────────────────

@app.post("/api/video/generate", dependencies=PROTECTED)
async def generate_video_campaign(
    product_id: int = Form(...),
    affiliate_link: str = Form(...),
    platforms: str = Form("tiktok,instagram"),
    use_elevenlabs: bool = Form(False),
    session: AsyncSession = Depends(get_session),
):
    platform_list = [p.strip() for p in platforms.split(",") if p.strip()]
    job = await create_job(
        session,
        "generate_video",
        {"product_id": product_id, "affiliate_link": affiliate_link, "platforms": platform_list},
        product_id=product_id,
    )
    await job_queue.enqueue(
        job.id,
        run_full_video_campaign,
        job.id,
        product_id,
        affiliate_link,
        platform_list,
        use_elevenlabs,
    )
    return {"job_id": job.id, "status": "queued"}


# ── Deal Post Campaign ──────────────────────────────────────────────────────────

@app.post("/api/deal-post/generate", dependencies=PROTECTED)
async def generate_deal_post_route(
    product_id: int = Form(...),
    affiliate_link: str = Form(...),
    style: str = Form("best_deal"),
    network: str = Form("amazon"),
    price_override: float = Form(0.0),
    session: AsyncSession = Depends(get_session),
):
    job = await create_job(
        session,
        "generate_deal_post",
        {"product_id": product_id, "affiliate_link": affiliate_link, "style": style, "network": network},
        product_id=product_id,
    )
    await job_queue.enqueue(
        job.id,
        run_deal_post_campaign,
        job.id,
        product_id,
        affiliate_link,
        style,
        network,
        price_override,
    )
    return {"job_id": job.id}


@app.post("/api/deal-post/publish-now", dependencies=PROTECTED)
async def publish_deal_post_now(
    post_id: int = Form(...),
    session: AsyncSession = Depends(get_session),
):
    """Backwards-compat alias — same behavior as /api/post/{id}/publish for FB Group posts."""
    return await _publish_post(post_id, session, video_url=None)


@app.post("/api/post/{post_id}/publish", dependencies=PROTECTED)
async def publish_post(
    post_id: int,
    video_url: str = Form(""),
    session: AsyncSession = Depends(get_session),
):
    """
    Dispatch publishing based on post.platform:
      - facebook_group  → FB Graph API photo upload
      - youtube / youtube_shorts → YouTube Data API
      - facebook        → FB Page video upload
      - instagram       → IG Reels (requires public video_url)
      - tiktok          → TikTok Content Posting API v2
    """
    return await _publish_post(post_id, session, video_url=video_url or None)


async def _publish_post(post_id: int, session: AsyncSession, video_url: str | None) -> dict:
    post = await session.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")

    platform = post.platform
    logger.info(f"Publishing post {post_id} to {platform}")
    _preflight_check(platform)

    try:
        url = await _dispatch_publisher(post, video_url)
        post.status = "published"
        post.platform_post_id = url
        post.published_at = datetime.utcnow()
        await session.commit()
        logger.info(f"Published post {post_id}: {url}")
        return {"url": url, "status": "published"}
    except PermissionError as e:
        post.status = "failed"
        await session.commit()
        logger.warning(f"Permission denied for post {post_id}: {e}")
        raise HTTPException(403, str(e))
    except ValueError as e:
        # e.g. missing video_url for Instagram
        logger.warning(f"Bad request for post {post_id}: {e}")
        raise HTTPException(400, str(e))
    except Exception as e:
        post.status = "failed"
        await session.commit()
        logger.exception(f"Failed to publish post {post_id}")
        raise HTTPException(500, str(e))


def _preflight_check(platform: str) -> None:
    """Raise HTTPException 400 if required API keys for the platform are missing."""
    s = get_settings()   # always fresh — respects hot-reload via /api/settings
    missing = []
    if platform in ("youtube", "youtube_shorts"):
        if not s.youtube_client_id or not s.youtube_refresh_token:
            missing = ["YOUTUBE_CLIENT_ID", "YOUTUBE_REFRESH_TOKEN"]
    elif platform in ("facebook", "facebook_group"):
        if not s.meta_user_access_token:
            missing = ["META_USER_ACCESS_TOKEN"]
        if platform == "facebook_group" and not s.meta_group_id:
            missing.append("META_GROUP_ID")
        if platform == "facebook" and not s.meta_page_id:
            missing.append("META_PAGE_ID")
    elif platform == "instagram":
        if not s.meta_user_access_token or not s.meta_instagram_account_id:
            missing = ["META_USER_ACCESS_TOKEN", "META_INSTAGRAM_ACCOUNT_ID"]
    elif platform == "tiktok":
        if not s.tiktok_client_key or not s.tiktok_refresh_token:
            missing = ["TIKTOK_CLIENT_KEY", "TIKTOK_REFRESH_TOKEN"]
    if missing:
        raise HTTPException(400, f"Missing keys for {platform}: {', '.join(missing)} — add them in the Settings tab")


async def _dispatch_publisher(post: Post, video_url: str | None) -> str:
    """Route to the correct platform publisher and return the resulting URL."""
    platform = post.platform

    if platform == "facebook_group":
        from publishers.facebook_group import post_to_facebook_group
        return await post_to_facebook_group(post.image_path, post.post_text)

    if platform in ("youtube", "youtube_shorts"):
        from publishers.youtube import upload_youtube_video
        # Parse hashtags out of post_text if present
        tags = [w.lstrip("#") for w in (post.post_text or "").split() if w.startswith("#")][:30]
        title = (post.post_text or "Best Deal").split("\n", 1)[0][:100]
        return await upload_youtube_video(
            video_path=post.video_path,
            title=title,
            description=post.post_text or "",
            tags=tags,
            thumbnail_path=post.image_path,
            privacy="public",
        )

    if platform == "facebook":
        from publishers.facebook_page import upload_facebook_page_video
        title = (post.post_text or "").split("\n", 1)[0][:255]
        return await upload_facebook_page_video(
            video_path=post.video_path,
            description=post.post_text or "",
            title=title,
            video_url=video_url,
        )

    if platform == "instagram":
        from publishers.instagram import upload_instagram_reel
        return await upload_instagram_reel(
            video_path=post.video_path,
            caption=post.post_text or "",
            video_url=video_url,
        )

    if platform == "tiktok":
        from publishers.tiktok import upload_tiktok_video
        return await upload_tiktok_video(
            video_path=post.video_path,
            caption=post.post_text or "",
        )

    raise ValueError(f"Unknown platform: {platform}")


# ── Shoe Shorts (photo → YouTube Short) ────────────────────────────────────────

SHOE_UPLOADS_DIR = Path("media") / "shoe_uploads"
SHOE_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg", "image/avif", "image/heic", "image/heif"}
MAX_PHOTOS = 6
MAX_PHOTO_MB = 20


@app.post("/api/shoe-short/upload", dependencies=PROTECTED)
async def upload_shoe_photos(
    photos: list[UploadFile] = File(...),
):
    """
    Upload 1–6 shoe photos.
    Returns saved file paths (relative to media/) for use in /api/shoe-short/generate.
    """
    if not photos:
        raise HTTPException(400, "No photos uploaded")
    if len(photos) > MAX_PHOTOS:
        raise HTTPException(400, f"Maximum {MAX_PHOTOS} photos allowed")

    saved: list[str] = []
    upload_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    dest_dir = SHOE_UPLOADS_DIR / upload_id
    dest_dir.mkdir(parents=True, exist_ok=True)

    for i, photo in enumerate(photos):
        # Accept any image/* content type (browser may report wrong MIME for AVIF/HEIC)
        ct = (photo.content_type or "").lower()
        if not ct.startswith("image/") and ct not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(400, f"File {photo.filename!r} is not a supported image type (got {ct})")
        content = await photo.read()
        if len(content) > MAX_PHOTO_MB * 1024 * 1024:
            raise HTTPException(400, f"File {photo.filename!r} exceeds {MAX_PHOTO_MB} MB limit")

        # Always save as JPEG (converts AVIF, HEIC, WebP, PNG → JPEG for FFmpeg compatibility)
        dest = dest_dir / f"photo_{i:02d}.jpg"
        try:
            from io import BytesIO
            from PIL import Image as _PILImage
            try:
                import pillow_avif  # registers AVIF support if available  # noqa: F401
            except ImportError:
                pass
            img = _PILImage.open(BytesIO(content)).convert("RGB")
            img.save(str(dest), "JPEG", quality=92)
        except Exception as _conv_err:
            logger.warning("Image conversion failed for %s: %s — saving raw", photo.filename, _conv_err)
            # If Pillow can't open it, save raw and let FFmpeg try
            dest = dest_dir / f"photo_{i:02d}{Path(photo.filename or 'photo.jpg').suffix or '.jpg'}"
            dest.write_bytes(content)

        saved.append(str(dest))

    return {"upload_id": upload_id, "paths": saved, "count": len(saved)}


@app.post("/api/shoe-short/generate", dependencies=PROTECTED)
async def generate_shoe_short_route(
    upload_id: str = Form(...),
    photo_paths: str = Form(...),          # JSON array of absolute paths from upload step
    product_name: str = Form(...),
    price: float = Form(0.0),
    affiliate_link: str = Form(...),
    platforms: str = Form("youtube_shorts"),
    slide_duration: int = Form(3),
    session: AsyncSession = Depends(get_session),
):
    """
    Kick off a shoe-short job.
    photo_paths: JSON array of absolute paths returned by /api/shoe-short/upload
    """
    try:
        paths: list[str] = json.loads(photo_paths)
    except Exception:
        raise HTTPException(400, "photo_paths must be a JSON array of file paths")

    if not paths:
        raise HTTPException(400, "No photo paths provided")

    # Validate all paths exist and are inside our uploads directory
    validated: list[str] = []
    for p in paths:
        pp = Path(p)
        if not pp.exists():
            raise HTTPException(400, f"Photo not found: {p}")
        validated.append(str(pp.resolve()))

    platform_list = [pl.strip() for pl in platforms.split(",") if pl.strip()]
    if not platform_list:
        platform_list = ["youtube_shorts"]

    job = await create_job(
        session,
        "shoe_short",
        {
            "photo_paths": validated,
            "product_name": product_name,
            "price": price,
            "affiliate_link": affiliate_link,
            "platforms": platform_list,
            "slide_duration": slide_duration,
        },
    )

    await job_queue.enqueue(
        job.id,
        run_shoe_short_campaign,
        job.id,
        validated,
        product_name,
        price,
        affiliate_link,
        platform_list,
        slide_duration,
    )

    return {"job_id": job.id, "status": "queued", "platforms": platform_list}


# ── Posts ───────────────────────────────────────────────────────────────────────

@app.get("/api/posts", dependencies=PROTECTED)
async def list_posts(status: str | None = None, session: AsyncSession = Depends(get_session)):
    posts = await get_posts(session, status=status)
    return {
        "posts": [
            {
                "id": p.id,
                "product_id": p.product_id,
                "post_type": p.post_type,
                "platform": p.platform,
                "status": p.status,
                "image_path": p.image_path,
                "video_path": p.video_path,
                "post_text": p.post_text,
                "created_at": str(p.created_at),
            }
            for p in posts
        ]
    }


# ── n8n callback ───────────────────────────────────────────────────────────────

@app.post("/api/n8n/published/{post_id}")
async def n8n_published_callback(post_id: int, request: Request):
    """
    Called by n8n after successfully publishing a post.
    Body: { "platform_post_id": "...", "platform_url": "https://..." }
    No auth required — n8n calls this from localhost only.
    """
    from sqlalchemy import select
    body = await request.json()
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Post).where(Post.id == post_id).limit(1)
        )
        post = result.scalar_one_or_none()
        if post:
            post.status = "published"
            post.platform_post_id = body.get("platform_url") or body.get("platform_post_id", "")
            await session.commit()
    return {"ok": True, "post_id": post_id}


# ── Job Status + SSE ────────────────────────────────────────────────────────────

@app.get("/api/job/{job_id}/status", dependencies=PROTECTED)
async def job_status(job_id: int):
    return job_queue.get_status(job_id)


@app.get("/api/job/{job_id}/stream", dependencies=PROTECTED)
async def job_stream(job_id: int):
    """Server-Sent Events endpoint for real-time job progress in the dashboard."""
    listener = job_queue.subscribe(job_id)

    async def event_generator():
        # Send current status immediately
        current = job_queue.get_status(job_id)
        yield f"data: {json.dumps(current)}\n\n"
        if current.get("status") in ("done", "failed"):
            return

        while True:
            try:
                event = await asyncio.wait_for(listener.get(), timeout=25)
                yield f"data: {json.dumps(event)}\n\n"
                if event.get("status") in ("done", "failed"):
                    break
            except asyncio.TimeoutError:
                yield ": ping\n\n"  # keep-alive

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Analytics ───────────────────────────────────────────────────────────────────

@app.get("/api/analytics", dependencies=PROTECTED)
async def analytics(session: AsyncSession = Depends(get_session)):
    clicks_by_network = await get_clicks_by_network(session)
    posts_by_platform = await get_posts_by_platform(session)
    return {
        "clicks_by_network": clicks_by_network,
        "posts_by_platform": posts_by_platform,
    }


# ── Settings Manager ────────────────────────────────────────────────────────────

_SETTINGS_ALLOW = {
    "GROQ_API_KEY", "ANTHROPIC_API_KEY",
    "ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID",
    "AMAZON_ASSOCIATE_TAG", "AMAZON_PAAPI_ACCESS_KEY", "AMAZON_PAAPI_SECRET_KEY", "AMAZON_PAAPI_PARTNER_TAG",
    "HOWL_API_KEY", "MAVELY_DEFAULT_LINK",
    "META_USER_ACCESS_TOKEN", "META_GROUP_ID", "META_PAGE_ID",
    "META_INSTAGRAM_ACCOUNT_ID", "META_APP_ID", "META_APP_SECRET",
    "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN",
    "TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REFRESH_TOKEN",
    "CANVA_API_TOKEN", "CANVA_BRAND_TEMPLATE_ID",
}


def _mask(val: str, show: int = 6) -> dict:
    if not val:
        return {"set": False, "preview": ""}
    return {"set": True, "preview": val[:show] + "…"}


def _plain(val: str) -> dict:
    return {"set": bool(val), "preview": val}


@app.get("/api/settings", dependencies=PROTECTED)
async def read_settings_status():
    s = get_settings()
    return {
        "groq_api_key":              _mask(s.groq_api_key),
        "anthropic_api_key":         _mask(s.anthropic_api_key),
        "elevenlabs_api_key":        _mask(s.elevenlabs_api_key),
        "amazon_associate_tag":      _plain(s.amazon_associate_tag),
        "meta_user_access_token":    _mask(s.meta_user_access_token),
        "meta_group_id":             _plain(s.meta_group_id),
        "meta_page_id":              _plain(s.meta_page_id),
        "meta_instagram_account_id": _plain(s.meta_instagram_account_id),
        "youtube_refresh_token":     _mask(s.youtube_refresh_token),
        "tiktok_refresh_token":      _mask(s.tiktok_refresh_token),
        "canva_api_token":           _mask(s.canva_api_token),
        "canva_brand_template_id":   _plain(s.canva_brand_template_id),
    }


@app.post("/api/settings", dependencies=PROTECTED)
async def save_settings(request: Request):
    body = await request.json()
    env_path = Path(".env")
    lines = env_path.read_text(encoding="utf-8").splitlines() if env_path.exists() else []
    updated: list[str] = []
    for raw_key, value in body.items():
        key = raw_key.upper()
        if key not in _SETTINGS_ALLOW:
            continue
        if not str(value).strip():   # skip blanks — don't overwrite existing values
            continue
        found = False
        for i, line in enumerate(lines):
            stripped = line.lstrip("# ").split("=")[0]
            if stripped == key:
                lines[i] = f"{key}={value}"
                found = True
                break
        if not found:
            lines.append(f"{key}={value}")
        updated.append(key)
    env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    get_settings.cache_clear()          # reload immediately — no restart needed
    return {"updated": updated, "count": len(updated)}


@app.get("/api/settings/test/{service}", dependencies=PROTECTED)
async def test_service(service: str):
    s = get_settings()
    try:
        if service == "groq":
            if not s.groq_api_key:
                return {"ok": False, "error": "GROQ_API_KEY not set"}
            async with httpx.AsyncClient(verify=False, timeout=10) as c:
                r = await c.get("https://api.groq.com/openai/v1/models",
                                headers={"Authorization": f"Bearer {s.groq_api_key}"})
            ok = r.status_code == 200
            return {"ok": ok, "models": len(r.json().get("data", [])) if ok else 0,
                    "error": "" if ok else f"HTTP {r.status_code}"}

        if service == "meta":
            if not s.meta_user_access_token:
                return {"ok": False, "error": "META_USER_ACCESS_TOKEN not set"}
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.get("https://graph.facebook.com/v18.0/me",
                                params={"access_token": s.meta_user_access_token,
                                        "fields": "id,name"})
            d = r.json()
            if "error" in d:
                return {"ok": False, "error": d["error"].get("message", "Token error")}
            return {"ok": True, "name": d.get("name"), "fb_id": d.get("id")}

        if service == "canva":
            if not s.canva_api_token:
                return {"ok": False, "error": "CANVA_API_TOKEN not set"}
            async with httpx.AsyncClient(verify=False, timeout=10) as c:
                r = await c.get("https://api.canva.com/rest/v1/users/me",
                                headers={"Authorization": f"Bearer {s.canva_api_token}"})
            if r.status_code == 200:
                return {"ok": True, "user": r.json().get("profile", {}).get("display_name", "OK")}
            return {"ok": False, "error": f"HTTP {r.status_code}"}

        if service == "elevenlabs":
            if not s.elevenlabs_api_key:
                return {"ok": False, "error": "ELEVENLABS_API_KEY not set"}
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.get("https://api.elevenlabs.io/v1/user",
                                headers={"xi-api-key": s.elevenlabs_api_key})
            if r.status_code == 200:
                tier = r.json().get("subscription", {}).get("tier", "unknown")
                return {"ok": True, "tier": tier}
            return {"ok": False, "error": f"HTTP {r.status_code}"}

        return {"ok": False, "error": f"Unknown service: {service}"}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


# ── Scheduler Config ────────────────────────────────────────────────────────────

@app.post("/api/scheduler/config", dependencies=PROTECTED)
async def configure_scheduler(
    posts_per_day: int = Form(3),
    hours: str = Form("9,13,18"),
):
    try:
        hour_list = [int(h.strip()) for h in hours.split(",") if h.strip()]
        if not hour_list or any(h < 0 or h > 23 for h in hour_list):
            raise ValueError
    except ValueError:
        raise HTTPException(400, "hours must be comma-separated integers 0-23")

    setup_scheduler(posts_per_day, hour_list)
    return {"message": f"Scheduler updated: {posts_per_day} posts/day at hours {hour_list}"}


# ═══════════════════════════════════════════════════════════════════════════════
# MULTI-PLATFORM PIPELINE — the new core
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/trending/products", dependencies=PROTECTED)
async def get_trending_products(category: str = "", limit: int = 30):
    """
    Discover trending Amazon products to film today.
    Optional ?category=electronics filters to a single category.
    """
    try:
        if category and category in CATEGORIES:
            products = await discover_trending_products(categories=[category])
        else:
            products = await discover_trending_products()
        return {"products": products[:limit], "count": len(products[:limit]),
                "categories": list(CATEGORIES.keys())}
    except Exception as exc:
        logger.error("Trending discovery failed: %s", exc)
        return {"products": [], "count": 0, "error": str(exc)[:200]}


@app.get("/api/trending/daily-picks", dependencies=PROTECTED)
async def daily_picks(count: int = 5):
    """Top N products to film today (cached/quick endpoint)."""
    try:
        picks = await get_daily_picks(count=count)
        return {"picks": picks, "count": len(picks)}
    except Exception as exc:
        return {"picks": [], "count": 0, "error": str(exc)[:200]}


@app.post("/api/multi-platform/upload", dependencies=PROTECTED)
async def multi_platform_upload(video: UploadFile = File(...)):
    """
    Upload a user-filmed video to the server.
    Returns the saved path for use with /api/multi-platform/publish.
    """
    if not video.content_type or not video.content_type.startswith("video/"):
        raise HTTPException(400, "File must be a video")

    uploads_dir = Path("media") / "user_videos"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = "".join(c for c in (video.filename or "video.mp4") if c.isalnum() or c in "._-")
    dest = uploads_dir / f"{ts}_{safe_name}"

    with open(dest, "wb") as f:
        shutil.copyfileobj(video.file, f)

    rel = str(dest).replace("\\", "/")
    return {
        "video_path": rel,
        "video_url": f"{settings.base_url}/media/user_videos/{dest.name}",
        "size_mb": round(dest.stat().st_size / 1024 / 1024, 2),
    }


@app.post("/api/multi-platform/publish", dependencies=PROTECTED)
async def multi_platform_publish(
    video_path: str = Form(...),
    product_name: str = Form(...),
    affiliate_link: str = Form(...),
    niche: str = Form(""),
    price: float = Form(0.0),
    features: str = Form(""),                                 # JSON list
    platforms: str = Form("youtube,tiktok,instagram,facebook"),
    vercel_domain: str = Form("nike-redirect.vercel.app"),
):
    """
    Trigger the full multi-platform publish pipeline:
      1. Create Vercel redirect for the affiliate link
      2. Generate platform-specific SEO via Groq
      3. Publish in parallel to YT/TT/IG/FB
      4. Return per-platform status + URLs
    """
    try:
        features_list = json.loads(features) if features.strip().startswith("[") else (
            [f.strip() for f in features.split(",") if f.strip()] if features else []
        )
    except json.JSONDecodeError:
        features_list = []

    platforms_list = [p.strip() for p in platforms.split(",") if p.strip()]

    async with AsyncSessionLocal() as session:
        job = await create_job(session, "multi_platform_publish", {
            "video_path": video_path,
            "product_name": product_name,
            "platforms": platforms_list,
        })
        job_id = job.id

    asyncio.create_task(_run_multi_publish_safe(
        job_id=job_id,
        video_path=video_path,
        product_name=product_name,
        affiliate_link=affiliate_link,
        niche=niche,
        price=price,
        features=features_list,
        platforms=platforms_list,
        vercel_domain=vercel_domain,
    ))

    return {"job_id": job_id, "status": "queued", "platforms": platforms_list}


async def _run_multi_publish_safe(**kwargs):
    """Wrap run_multi_platform_publish with error capture."""
    job_id = kwargs.pop("job_id")
    try:
        await run_multi_platform_publish(job_id=job_id, **kwargs)
    except Exception as exc:
        logger.exception("Multi-platform publish job %s failed: %s", job_id, exc)
        async with AsyncSessionLocal() as session:
            await update_job(session, job_id, status="failed",
                              result=json.dumps({"error": str(exc)[:500]}))


@app.post("/api/multi-platform/seo-preview", dependencies=PROTECTED)
async def seo_preview(
    product_name: str = Form(...),
    affiliate_link: str = Form(...),
    niche: str = Form(""),
    price: float = Form(0.0),
    features: str = Form(""),
):
    """
    Generate (and preview) the SEO bundle BEFORE publishing.
    Useful for the dashboard to show users exactly what will be posted.
    """
    try:
        features_list = json.loads(features) if features.strip().startswith("[") else (
            [f.strip() for f in features.split(",") if f.strip()] if features else []
        )
    except json.JSONDecodeError:
        features_list = []

    vercel_url = create_redirect(product_name, affiliate_link)
    seo = await generate_multi_platform_seo(
        product_name=product_name,
        affiliate_link=vercel_url,
        niche=niche,
        price=price,
        features=features_list,
    )
    return {"vercel_url": vercel_url, "seo": seo}


@app.get("/api/redirects", dependencies=PROTECTED)
async def get_redirects():
    """List all Vercel redirects currently configured (per-product affiliate links)."""
    return {"redirects": list_redirects()}


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK + ANALYTICS V2
# ═══════════════════════════════════════════════════════════════════════════════

from utils.health_check import check_all_systems
from analytics.dashboard_metrics import (
    get_overview, get_platform_breakdown, get_clicks_timeline,
    get_top_products, get_publish_queue_status,
)


@app.get("/api/health", dependencies=PROTECTED)
async def system_health():
    """Returns which integrations are ready vs which need setup."""
    return await check_all_systems()


@app.get("/api/analytics/overview", dependencies=PROTECTED)
async def analytics_overview():
    return await get_overview()


@app.get("/api/analytics/platform-breakdown", dependencies=PROTECTED)
async def analytics_platforms(days: int = 7):
    return await get_platform_breakdown(days=days)


@app.get("/api/analytics/clicks-timeline", dependencies=PROTECTED)
async def analytics_clicks(days: int = 30):
    return {"timeline": await get_clicks_timeline(days=days)}


@app.get("/api/analytics/top-products", dependencies=PROTECTED)
async def analytics_top(limit: int = 10):
    return {"products": await get_top_products(limit=limit)}


@app.get("/api/queue/status", dependencies=PROTECTED)
async def queue_status():
    return await get_publish_queue_status()


# ═══════════════════════════════════════════════════════════════════════════════
# ADVANCED FEATURES — Thumbnail AI, Predictor, Translator, Schedule
# ═══════════════════════════════════════════════════════════════════════════════

from generators.thumbnail_ai import generate_youtube_thumbnail
from generators.performance_predictor import predict_performance
from generators.caption_translator import translate_seo_bundle, translate_text, LANG_NAMES


@app.post("/api/thumbnail/generate", dependencies=PROTECTED)
async def gen_thumbnail(
    product_name: str = Form(...),
    price: float = Form(0.0),
    niche: str = Form("default"),
    format: str = Form("youtube"),                 # "youtube" or "shorts"
    product_image_url: str = Form(""),             # optional remote URL
):
    """Generate a high-CTR thumbnail for YouTube."""
    import uuid
    out_dir = Path("media") / "thumbnails"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{uuid.uuid4().hex[:10]}.jpg"

    # Optional: download product image
    local_image = None
    if product_image_url.startswith("http"):
        try:
            async with httpx.AsyncClient(verify=False, timeout=15) as client:
                resp = await client.get(product_image_url)
                if resp.status_code == 200:
                    tmp = out_dir / f"src_{uuid.uuid4().hex[:8]}.jpg"
                    tmp.write_bytes(resp.content)
                    local_image = str(tmp)
        except Exception as exc:
            logger.warning("Failed to fetch product image: %s", exc)

    generate_youtube_thumbnail(
        output_path=str(out_path),
        product_name=product_name,
        price=price,
        product_image_path=local_image,
        niche=niche,
        format=format,
    )
    rel = str(out_path).replace("\\", "/").replace("media/", "")
    return {
        "thumbnail_path": str(out_path),
        "thumbnail_url": f"{settings.base_url}/media/{rel}",
    }


@app.post("/api/predictor/score", dependencies=PROTECTED)
async def score_performance(
    title: str = Form(""),
    caption: str = Form(""),
    hashtags: str = Form(""),
    niche: str = Form(""),
    product_name: str = Form(""),
    features: str = Form(""),
):
    """Predict viral potential before publishing."""
    try:
        tags = json.loads(hashtags) if hashtags.strip().startswith("[") else [
            t.strip() for t in hashtags.split() if t.strip()
        ]
    except json.JSONDecodeError:
        tags = []
    try:
        feats = json.loads(features) if features.strip().startswith("[") else [
            f.strip() for f in features.split("\n") if f.strip()
        ]
    except json.JSONDecodeError:
        feats = []

    return predict_performance(
        title=title, caption=caption, hashtags=tags,
        niche=niche, product_name=product_name, features=feats,
    )


@app.post("/api/translate/seo", dependencies=PROTECTED)
async def translate_seo(
    seo_json: str = Form(...),
    target_languages: str = Form("en,es"),
    source_lang: str = Form("fr"),
):
    """Translate a full SEO bundle into N target languages."""
    try:
        seo = json.loads(seo_json)
    except json.JSONDecodeError as exc:
        raise HTTPException(400, f"Invalid SEO JSON: {exc}")

    langs = [l.strip() for l in target_languages.split(",") if l.strip()]
    bundle = await translate_seo_bundle(seo, langs, source_lang)
    return {"bundle": bundle, "languages": list(bundle.keys())}


@app.get("/api/languages", dependencies=PROTECTED)
async def available_languages():
    return {"languages": LANG_NAMES}


# ── Schedule publishing ────────────────────────────────────────────────────────

@app.post("/api/schedule/publish", dependencies=PROTECTED)
async def schedule_publish(
    video_path: str = Form(...),
    product_name: str = Form(...),
    affiliate_link: str = Form(...),
    publish_at: str = Form(...),                # ISO datetime
    niche: str = Form(""),
    price: float = Form(0.0),
    features: str = Form(""),
    platforms: str = Form("youtube,tiktok,instagram,facebook"),
):
    """
    Queue a video for delayed publish.
    publish_at must be ISO 8601 (e.g. 2026-05-22T18:00:00).
    """
    try:
        scheduled = datetime.fromisoformat(publish_at)
    except ValueError:
        raise HTTPException(400, "publish_at must be ISO 8601 datetime")

    if scheduled < datetime.utcnow():
        raise HTTPException(400, "publish_at must be in the future")

    try:
        feats = json.loads(features) if features.strip().startswith("[") else (
            [f.strip() for f in features.split(",") if f.strip()] if features else []
        )
    except json.JSONDecodeError:
        feats = []

    meta = json.dumps({
        "product_name": product_name,
        "niche": niche,
        "price": price,
        "features": feats,
        "platforms": [p.strip() for p in platforms.split(",")],
        "scheduled_for": publish_at,
    })

    async with AsyncSessionLocal() as session:
        post = await create_post(
            session,
            product_id=None,
            post_type="multi_platform_video",
            platform="scheduled",
            post_text=meta,
            video_path=video_path,
            image_path=None,
            affiliate_link=affiliate_link,
            status="queued",
        )

    return {
        "scheduled": True,
        "post_id": post.id,
        "publish_at": publish_at,
        "platforms": platforms,
    }


@app.get("/api/schedule/upcoming", dependencies=PROTECTED)
async def schedule_upcoming():
    """List scheduled publishes."""
    from sqlalchemy import select
    async with AsyncSessionLocal() as session:
        stmt = (
            select(Post)
            .where(Post.status == "queued")
            .where(Post.post_type == "multi_platform_video")
            .order_by(Post.created_at)
        )
        posts = (await session.execute(stmt)).scalars().all()

    upcoming = []
    for p in posts:
        meta = {}
        if p.post_text and p.post_text.startswith("{"):
            try: meta = json.loads(p.post_text)
            except: pass
        upcoming.append({
            "post_id": p.id,
            "product_name": meta.get("product_name", f"Post {p.id}"),
            "scheduled_for": meta.get("scheduled_for"),
            "platforms": meta.get("platforms", []),
            "created_at": str(p.created_at),
            "video_path": p.video_path,
        })
    return {"upcoming": upcoming, "count": len(upcoming)}


# ── SSE live progress ─────────────────────────────────────────────────────────

@app.get("/api/job/{job_id}/sse")
async def job_sse(job_id: int):
    """
    Server-Sent Events stream for live job progress.
    Connect from JS:
      const sse = new EventSource(`/api/job/${jobId}/sse`);
      sse.onmessage = (e) => console.log(JSON.parse(e.data));
    """
    from database.crud import get_session
    from database.models import Job

    async def event_stream():
        last_status = None
        for _ in range(240):  # 4 minutes max
            async with AsyncSessionLocal() as session:
                job = await session.get(Job, job_id)
                if not job:
                    yield f"data: {json.dumps({'error': 'not found'})}\n\n"
                    return
                payload = {
                    "id": job.id,
                    "status": job.status,
                    "type": job.job_type,
                    "result": job.params,
                }
                if job.status != last_status:
                    yield f"data: {json.dumps(payload)}\n\n"
                    last_status = job.status
                if job.status in ("done", "failed"):
                    return
            await asyncio.sleep(1)

    return StreamingResponse(event_stream(), media_type="text/event-stream")
