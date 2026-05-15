import asyncio
import json
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession

from affiliate.click_tracker import handle_redirect
from affiliate.link_manager import generate_affiliate_link
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
from jobs.worker import run_deal_post_campaign, run_full_video_campaign
from scheduler.auto_post import setup_scheduler, start_scheduler
from scrapers.amazon import scrape_amazon
from scrapers.generic import scrape_generic
from scrapers.walmart import scrape_walmart

settings = get_settings()

# Ensure media dir exists at startup
Path("media").mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    asyncio.create_task(job_queue.run_worker())
    setup_scheduler()
    start_scheduler()
    yield


app = FastAPI(title="Affiliate AutoPublish", lifespan=lifespan)
app.mount("/static", StaticFiles(directory="dashboard/static"), name="static")
app.mount("/media", StaticFiles(directory="media"), name="media")
templates = Jinja2Templates(directory="dashboard/templates")


# ── Dashboard ──────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# ── Scrape ─────────────────────────────────────────────────────────────────────

@app.post("/api/scrape")
async def scrape_product(url: str = Form(...), session: AsyncSession = Depends(get_session)):
    url = url.strip()
    if "amazon." in url:
        data = await scrape_amazon(url)
    elif "walmart.com" in url:
        data = await scrape_walmart(url)
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

@app.get("/api/products")
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

@app.post("/api/affiliate/generate")
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
async def click_redirect(rid: str, request: Request, session: AsyncSession = Depends(get_session)):
    return await handle_redirect(rid, request, session)


# ── Video Campaign ──────────────────────────────────────────────────────────────

@app.post("/api/video/generate")
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

@app.post("/api/deal-post/generate")
async def generate_deal_post_route(
    product_id: int = Form(...),
    affiliate_link: str = Form(...),
    style: str = Form("best_deal"),
    network: str = Form("amazon"),
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
    )
    return {"job_id": job.id}


@app.post("/api/deal-post/publish-now")
async def publish_deal_post_now(
    post_id: int = Form(...),
    session: AsyncSession = Depends(get_session),
):
    from publishers.facebook_group import post_to_facebook_group
    from datetime import datetime

    post = await session.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")

    try:
        url = await post_to_facebook_group(post.image_path, post.post_text)
        post.status = "published"
        post.platform_post_id = url
        post.published_at = datetime.utcnow()
        await session.commit()
        return {"url": url, "status": "published"}
    except PermissionError as e:
        raise HTTPException(403, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Posts ───────────────────────────────────────────────────────────────────────

@app.get("/api/posts")
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


# ── Job Status + SSE ────────────────────────────────────────────────────────────

@app.get("/api/job/{job_id}/status")
async def job_status(job_id: int):
    return job_queue.get_status(job_id)


@app.get("/api/job/{job_id}/stream")
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

@app.get("/api/analytics")
async def analytics(session: AsyncSession = Depends(get_session)):
    clicks_by_network = await get_clicks_by_network(session)
    posts_by_platform = await get_posts_by_platform(session)
    return {
        "clicks_by_network": clicks_by_network,
        "posts_by_platform": posts_by_platform,
    }


# ── Scheduler Config ────────────────────────────────────────────────────────────

@app.post("/api/scheduler/config")
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
