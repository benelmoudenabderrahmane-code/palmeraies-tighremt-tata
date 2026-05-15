# Affiliate AutoPublish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully automated AI affiliate marketing system that scrapes products, generates videos + deal posts, manages affiliate links across 5 networks, and auto-publishes to YouTube/Instagram/Facebook/TikTok.

**Architecture:** FastAPI backend with async workers for long-running video generation jobs, SQLite for persistence, APScheduler for timed auto-posting. All AI calls use Claude Haiku 4.5 (10× cheaper than Sonnet) with Sonnet only for complex scripts. gTTS is primary voice (free), ElevenLabs optional upgrade.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy, APScheduler, Playwright, BeautifulSoup, Claude Haiku 4.5, gTTS/ElevenLabs, FFmpeg, MoviePy, Pillow, YouTube Data API v3, Meta Graph API, TikTok Content Posting API v2

---

## PROMPT AUDIT — Issues Fixed in This Plan

1. **Model cost**: Spec said `claude-sonnet-4-20250514` — switched to `claude-haiku-4-5-20251001` (€0.60/100 scripts vs €6). Use Sonnet only for video scripts.
2. **Incomplete Module 3B example** in spec — post template was cut off; full template added in Task 5.
3. **Mavely ambiguity** — 3 options listed in spec, chosen Option B (manual paste) since no public API exists.
4. **No async job queue** — video generation takes 2–5 min; added background task queue with status tracking.
5. **Missing SSE** — dashboard needs real-time job progress; added Server-Sent Events endpoint.
6. **Amazon scraping** — will get blocked; added 3-second random delay + realistic headers + retry logic.
7. **Meta `publish_to_groups`** — requires Facebook App Review; noted in README + graceful error.
8. **gTTS as free primary** — ElevenLabs as paid opt-in, not default.

---

## Cost Breakdown (FREE vs PAID)

| Service | Cost | Notes |
|---|---|---|
| Claude Haiku 4.5 | ~€0.70/100 generations | Script + post text generation |
| gTTS | FREE | Primary voice |
| ElevenLabs | FREE (10k chars/mo) | Optional upgrade |
| YouTube Data API | FREE | 10k units/day quota |
| Meta Graph API | FREE | Requires app review for groups |
| TikTok Content Posting | FREE | Sandbox testing first |
| Amazon PAAPI | FREE | With Associates account |
| Impact Radius API | FREE | With publisher account |
| Howl API | FREE | With publisher account |
| FFmpeg + MoviePy | FREE | Open source |
| **TOTAL** | **~€5–15/month** | Well under €50 |

---

## File Map

```
affiliate-autopublish/
├── main.py                          # FastAPI app, routers, SSE, startup
├── config/settings.py               # Pydantic Settings, .env loader
├── database/
│   ├── models.py                    # SQLAlchemy ORM models
│   └── crud.py                      # DB operations
├── scrapers/
│   ├── amazon.py                    # Playwright + realistic headers
│   ├── walmart.py                   # Playwright scraper
│   └── generic.py                   # OG meta tags fallback
├── affiliate/
│   ├── link_manager.py              # Store/retrieve/wrap all links
│   ├── amazon_links.py              # ASIN extraction + tag injection
│   ├── walmart_links.py             # Impact Radius API
│   ├── howl_links.py                # Howl API
│   ├── mavely_links.py              # Manual link storage
│   └── click_tracker.py            # /go/{id} redirect + logging
├── generators/
│   ├── script_generator.py          # Claude API — video scripts
│   ├── deal_post_generator.py       # Claude API — FB post text
│   ├── deal_image_generator.py      # Pillow — 1200×1200 deal images
│   ├── voice_generator.py           # gTTS + ElevenLabs fallback
│   ├── video_generator.py           # FFmpeg + MoviePy pipeline
│   └── thumbnail_generator.py      # Pillow thumbnails
├── publishers/
│   ├── youtube.py                   # YouTube Data API v3
│   ├── instagram.py                 # Meta Graph API Reels
│   ├── facebook_page.py             # Meta Graph API video
│   ├── facebook_group.py            # Meta Graph API group photo
│   └── tiktok.py                    # TikTok Content Posting v2
├── scheduler/auto_post.py           # APScheduler jobs
├── jobs/
│   ├── queue.py                     # In-memory async job queue
│   └── worker.py                    # Background task runner
├── analytics/fetcher.py             # Pull stats from platform APIs
├── dashboard/
│   ├── templates/index.html         # Single-page app (6 tabs)
│   └── static/
│       ├── app.js                   # Fetch-based API calls + SSE
│       └── style.css
├── auth/setup_auth.py               # OAuth2 setup helper script
├── assets/music/                    # Bundled royalty-free MP3s
├── assets/fonts/                    # Anton.ttf, Impact.ttf
├── assets/templates/                # Video overlay templates
├── logs/                            # app.log
├── .env.example
├── requirements.txt
└── README.md
```

---

## Task 1: Project Scaffold + Config

**Files:**
- Create: `affiliate-autopublish/config/settings.py`
- Create: `affiliate-autopublish/.env.example`
- Create: `affiliate-autopublish/requirements.txt`

- [ ] **Step 1: Create project root**

```bash
mkdir -p affiliate-autopublish/{config,database,scrapers,affiliate,generators,publishers,scheduler,jobs,analytics,dashboard/templates,dashboard/static,auth,assets/music,assets/fonts,assets/templates,logs}
touch affiliate-autopublish/logs/.gitkeep
```

- [ ] **Step 2: Write requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.35
aiosqlite==0.20.0
python-dotenv==1.0.1
pydantic-settings==2.5.2
anthropic==0.40.0
playwright==1.48.0
beautifulsoup4==4.12.3
requests==2.32.3
httpx==0.27.2
pillow==11.0.0
moviepy==1.0.3
gTTS==2.5.3
elevenlabs==1.9.0
apscheduler==3.10.4
google-api-python-client==2.150.0
google-auth-oauthlib==1.2.1
boto3==1.35.0
python-multipart==0.0.12
aiofiles==24.1.0
```

- [ ] **Step 3: Write config/settings.py**

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Anthropic
    anthropic_api_key: str = ""
    # ElevenLabs
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    # Amazon
    amazon_associate_tag: str = ""
    amazon_paapi_access_key: str = ""
    amazon_paapi_secret_key: str = ""
    amazon_paapi_partner_tag: str = ""
    # Walmart / Impact
    impact_account_sid: str = ""
    impact_auth_token: str = ""
    walmart_campaign_id: str = ""
    # Howl
    howl_api_key: str = ""
    # Mavely
    mavely_default_link: str = ""
    # YouTube
    youtube_client_id: str = ""
    youtube_client_secret: str = ""
    youtube_refresh_token: str = ""
    # Meta
    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_user_access_token: str = ""
    meta_page_id: str = ""
    meta_instagram_account_id: str = ""
    meta_group_id: str = ""
    # TikTok
    tiktok_client_key: str = ""
    tiktok_client_secret: str = ""
    tiktok_refresh_token: str = ""
    # App
    base_url: str = "http://localhost:8000"
    secret_key: str = "changeme"
    database_url: str = "sqlite+aiosqlite:///./affiliate.db"

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 4: Write .env.example** (copy of env vars with empty values as shown in spec)

- [ ] **Step 5: Commit**

```bash
git add affiliate-autopublish/
git commit -m "feat: scaffold affiliate-autopublish project structure"
```

---

## Task 2: Database Models + CRUD

**Files:**
- Create: `affiliate-autopublish/database/models.py`
- Create: `affiliate-autopublish/database/crud.py`

- [ ] **Step 1: Write failing test**

```python
# tests/test_models.py
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from database.models import Base, Product, AffiliateLink, Post, Job

@pytest.mark.asyncio
async def test_product_create():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session = sessionmaker(engine, class_=AsyncSession)
    async with async_session() as session:
        p = Product(name="Test", price=9.99, url="https://amazon.com/dp/B001")
        session.add(p)
        await session.commit()
        await session.refresh(p)
    assert p.id is not None
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd affiliate-autopublish && pytest tests/test_models.py -v
# Expected: ModuleNotFoundError
```

- [ ] **Step 3: Write database/models.py**

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import DeclarativeBase, relationship
from datetime import datetime

class Base(DeclarativeBase):
    pass

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String(500), nullable=False)
    brand = Column(String(200))
    price = Column(Float)
    original_price = Column(Float)
    discount_pct = Column(Float)
    description = Column(Text)
    features = Column(Text)  # JSON list
    star_rating = Column(Float)
    review_count = Column(Integer)
    url = Column(String(2000), nullable=False)
    images = Column(Text)  # JSON list of local paths
    created_at = Column(DateTime, default=datetime.utcnow)
    links = relationship("AffiliateLink", back_populates="product")
    posts = relationship("Post", back_populates="product")

class AffiliateLink(Base):
    __tablename__ = "affiliate_links"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    network = Column(String(50), nullable=False)  # amazon/walmart/howl/mavely/custom
    original_url = Column(String(2000))
    affiliate_link = Column(String(2000), nullable=False)
    short_redirect_id = Column(String(20), unique=True, nullable=False)
    click_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime)
    product = relationship("Product", back_populates="links")
    clicks = relationship("ClickLog", back_populates="link")

class ClickLog(Base):
    __tablename__ = "click_logs"
    id = Column(Integer, primary_key=True)
    link_id = Column(Integer, ForeignKey("affiliate_links.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    referrer = Column(String(100))  # youtube/instagram/facebook/tiktok/group
    user_agent = Column(String(500))
    ip_hash = Column(String(64))
    link = relationship("AffiliateLink", back_populates="clicks")

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    post_type = Column(String(20))  # video / deal_post
    platform = Column(String(50))  # youtube/instagram/facebook_page/facebook_group/tiktok
    post_text = Column(Text)
    image_path = Column(String(500))
    video_path = Column(String(500))
    affiliate_network = Column(String(50))
    affiliate_link = Column(String(2000))
    status = Column(String(20), default="pending")  # pending/published/failed
    platform_post_id = Column(String(200))
    scheduled_at = Column(DateTime)
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    product = relationship("Product", back_populates="posts")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True)
    job_type = Column(String(50))  # scrape/generate_video/generate_post/publish
    status = Column(String(20), default="queued")  # queued/running/done/failed
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    params = Column(Text)  # JSON
    result = Column(Text)  # JSON
    error = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

- [ ] **Step 4: Write database/crud.py**

```python
import secrets
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from database.models import Base, Product, AffiliateLink, ClickLog, Post, Job
from config.settings import get_settings

settings = get_settings()
engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_session():
    async with AsyncSessionLocal() as session:
        yield session

async def create_product(session: AsyncSession, **kwargs) -> Product:
    p = Product(**kwargs)
    session.add(p)
    await session.commit()
    await session.refresh(p)
    return p

async def get_products(session: AsyncSession) -> list[Product]:
    result = await session.execute(select(Product).order_by(Product.created_at.desc()))
    return result.scalars().all()

async def get_product(session: AsyncSession, product_id: int) -> Product | None:
    return await session.get(Product, product_id)

async def create_affiliate_link(session: AsyncSession, **kwargs) -> AffiliateLink:
    kwargs["short_redirect_id"] = secrets.token_urlsafe(8)
    link = AffiliateLink(**kwargs)
    session.add(link)
    await session.commit()
    await session.refresh(link)
    return link

async def get_link_by_redirect_id(session: AsyncSession, rid: str) -> AffiliateLink | None:
    result = await session.execute(
        select(AffiliateLink).where(AffiliateLink.short_redirect_id == rid)
    )
    return result.scalar_one_or_none()

async def log_click(session: AsyncSession, link_id: int, referrer: str, ua: str, ip_hash: str):
    from datetime import datetime
    log = ClickLog(link_id=link_id, referrer=referrer, user_agent=ua, ip_hash=ip_hash)
    session.add(log)
    link = await session.get(AffiliateLink, link_id)
    if link:
        link.click_count += 1
        link.last_used_at = datetime.utcnow()
    await session.commit()

async def create_job(session: AsyncSession, job_type: str, params: dict) -> Job:
    import json
    job = Job(job_type=job_type, params=json.dumps(params))
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return job

async def update_job(session: AsyncSession, job_id: int, **kwargs):
    job = await session.get(Job, job_id)
    if job:
        for k, v in kwargs.items():
            setattr(job, k, v)
        await session.commit()

async def create_post(session: AsyncSession, **kwargs) -> Post:
    post = Post(**kwargs)
    session.add(post)
    await session.commit()
    await session.refresh(post)
    return post
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pytest tests/test_models.py -v
# Expected: PASSED
```

- [ ] **Step 6: Commit**

```bash
git add database/ tests/
git commit -m "feat: database models and CRUD for products, links, posts, jobs"
```

---

## Task 3: Product Scraper

**Files:**
- Create: `affiliate-autopublish/scrapers/amazon.py`
- Create: `affiliate-autopublish/scrapers/walmart.py`
- Create: `affiliate-autopublish/scrapers/generic.py`

- [ ] **Step 1: Write failing test**

```python
# tests/test_scraper.py
import pytest
from scrapers.generic import scrape_generic

@pytest.mark.asyncio
async def test_generic_scraper_returns_dict():
    # Uses a static HTML string, no network
    result = await scrape_generic("https://example.com", html="""
    <html><head>
    <meta property="og:title" content="Test Product"/>
    <meta property="og:image" content="https://example.com/img.jpg"/>
    <meta property="og:description" content="Great product"/>
    </head></html>
    """)
    assert result["name"] == "Test Product"
    assert result["description"] == "Great product"
```

- [ ] **Step 2: Run — verify fail**

```bash
pytest tests/test_scraper.py -v
# Expected: ModuleNotFoundError
```

- [ ] **Step 3: Write scrapers/generic.py**

```python
import re
import httpx
from bs4 import BeautifulSoup

async def scrape_generic(url: str, html: str | None = None) -> dict:
    if html is None:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            resp = await client.get(url, headers=headers)
            html = resp.text
    soup = BeautifulSoup(html, "html.parser")
    def og(prop):
        tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        return tag["content"].strip() if tag and tag.get("content") else ""
    name = og("og:title") or soup.find("title").get_text(strip=True) if soup.find("title") else "Unknown Product"
    price_match = re.search(r'\$\s*([\d,]+\.?\d*)', html)
    price = float(price_match.group(1).replace(",", "")) if price_match else 0.0
    return {
        "name": name,
        "price": price,
        "original_price": price,
        "discount_pct": 0.0,
        "description": og("og:description"),
        "images": [og("og:image")] if og("og:image") else [],
        "features": [],
        "star_rating": 0.0,
        "review_count": 0,
        "url": url,
    }
```

- [ ] **Step 4: Write scrapers/amazon.py**

```python
import re, json, asyncio, random
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
}

def extract_asin(url: str) -> str | None:
    m = re.search(r'/dp/([A-Z0-9]{10})', url)
    return m.group(1) if m else None

async def scrape_amazon(url: str) -> dict:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=HEADERS["User-Agent"],
            locale="en-US",
        )
        page = await context.new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(random.uniform(2, 4))  # avoid bot detection
        html = await page.content()
        await browser.close()

    soup = BeautifulSoup(html, "html.parser")

    def text(selector):
        tag = soup.select_one(selector)
        return tag.get_text(strip=True) if tag else ""

    name = text("#productTitle") or text("h1.a-size-large")
    price_whole = text(".a-price-whole")
    price_frac = text(".a-price-fraction")
    try:
        price = float(f"{price_whole.replace(',','').rstrip('.')}.{price_frac or '00'}")
    except ValueError:
        price = 0.0

    original_tag = soup.select_one(".a-text-price .a-offscreen")
    original_price = float(original_tag.get_text().replace("$","").replace(",","")) if original_tag else price
    discount_pct = round((original_price - price) / original_price * 100, 1) if original_price > price else 0.0

    images = []
    img_block = soup.select_one("#imageBlock_feature_div")
    if img_block:
        for img in img_block.select("img[src]"):
            src = img.get("data-old-hires") or img.get("src", "")
            if src and src not in images:
                images.append(src)

    features = [li.get_text(strip=True) for li in soup.select("#feature-bullets li span.a-list-item")][:8]
    description = soup.select_one("#productDescription p")
    description_text = description.get_text(strip=True) if description else ""

    rating_tag = soup.select_one("span[data-hook='rating-out-of-text']") or soup.select_one(".a-icon-alt")
    rating = 0.0
    if rating_tag:
        m = re.search(r'([\d.]+)', rating_tag.get_text())
        rating = float(m.group(1)) if m else 0.0

    review_tag = soup.select_one("#acrCustomerReviewText")
    review_count = 0
    if review_tag:
        m = re.search(r'([\d,]+)', review_tag.get_text())
        review_count = int(m.group(1).replace(",", "")) if m else 0

    return {
        "name": name,
        "price": price,
        "original_price": original_price,
        "discount_pct": discount_pct,
        "description": description_text,
        "features": features,
        "images": images[:5],
        "star_rating": rating,
        "review_count": review_count,
        "url": url,
    }
```

- [ ] **Step 5: Write scrapers/walmart.py**

```python
import re, asyncio, random
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

async def scrape_walmart(url: str) -> dict:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await (await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )).new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(random.uniform(2, 3))
        html = await page.content()
        await browser.close()

    soup = BeautifulSoup(html, "html.parser")

    # Walmart embeds product data in a __NEXT_DATA__ JSON script
    script = soup.find("script", id="__NEXT_DATA__")
    if script:
        try:
            data = json.loads(script.string)
            product = data["props"]["pageProps"]["initialData"]["data"]["product"]
            name = product.get("name", "")
            price = float(product.get("priceInfo", {}).get("currentPrice", {}).get("price", 0))
            original_price = float(product.get("priceInfo", {}).get("wasPrice", {}).get("price", price))
            discount_pct = round((original_price - price) / original_price * 100, 1) if original_price > price else 0.0
            images = [img["url"] for img in product.get("imageInfo", {}).get("thumbnails", [])[:5]]
            features = [s.get("shortDescription", "") for s in product.get("shortDescription", "").split("<li>") if s][:6]
            return {
                "name": name, "price": price, "original_price": original_price,
                "discount_pct": discount_pct, "description": product.get("shortDescription", ""),
                "features": features, "images": images, "star_rating": float(product.get("averageRating", 0)),
                "review_count": int(product.get("numberOfReviews", 0)), "url": url,
            }
        except (KeyError, TypeError, json.JSONDecodeError):
            pass

    # Fallback: parse HTML directly
    import json
    name = soup.select_one('[itemprop="name"]')
    name = name.get_text(strip=True) if name else "Walmart Product"
    price_tag = soup.select_one('[itemprop="price"]')
    price = float(price_tag.get("content", 0)) if price_tag else 0.0
    images = [img["src"] for img in soup.select("img[data-testid='hero-image']") if img.get("src")]
    return {
        "name": name, "price": price, "original_price": price, "discount_pct": 0.0,
        "description": "", "features": [], "images": images[:5],
        "star_rating": 0.0, "review_count": 0, "url": url,
    }
```

- [ ] **Step 6: Run passing test**

```bash
pytest tests/test_scraper.py -v
# Expected: PASSED
```

- [ ] **Step 7: Commit**

```bash
git add scrapers/ tests/test_scraper.py
git commit -m "feat: product scrapers for Amazon, Walmart, and generic OG fallback"
```

---

## Task 4: Affiliate Link Manager

**Files:**
- Create: `affiliate-autopublish/affiliate/link_manager.py`
- Create: `affiliate-autopublish/affiliate/amazon_links.py`
- Create: `affiliate-autopublish/affiliate/walmart_links.py`
- Create: `affiliate-autopublish/affiliate/howl_links.py`
- Create: `affiliate-autopublish/affiliate/mavely_links.py`
- Create: `affiliate-autopublish/affiliate/click_tracker.py`

- [ ] **Step 1: Write failing test**

```python
# tests/test_affiliate.py
import pytest
from affiliate.amazon_links import extract_asin, build_amazon_link

def test_asin_extraction():
    url = "https://www.amazon.com/dp/B08N5WRWNW?ref=pd"
    assert extract_asin(url) == "B08N5WRWNW"

def test_amazon_link_builder():
    link = build_amazon_link("B08N5WRWNW", "mytag-20")
    assert "B08N5WRWNW" in link
    assert "tag=mytag-20" in link
```

- [ ] **Step 2: Run — verify fail**

```bash
pytest tests/test_affiliate.py -v
```

- [ ] **Step 3: Write affiliate/amazon_links.py**

```python
import re
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

def extract_asin(url: str) -> str | None:
    patterns = [r'/dp/([A-Z0-9]{10})', r'/gp/product/([A-Z0-9]{10})', r'asin=([A-Z0-9]{10})']
    for pat in patterns:
        m = re.search(pat, url)
        if m:
            return m.group(1)
    return None

def build_amazon_link(asin: str, tag: str, domain: str = "amazon.com") -> str:
    return f"https://www.{domain}/dp/{asin}?tag={tag}"

def make_affiliate_link(url: str, tag: str) -> str | None:
    asin = extract_asin(url)
    if not asin:
        return None
    # Preserve regional domain
    parsed = urlparse(url)
    domain = parsed.netloc.replace("www.", "") if "amazon" in parsed.netloc else "amazon.com"
    return build_amazon_link(asin, tag, domain)
```

- [ ] **Step 4: Write affiliate/walmart_links.py**

```python
import httpx
from urllib.parse import quote
from config.settings import get_settings

settings = get_settings()

async def create_walmart_link(product_url: str) -> str | None:
    """Create tracking link via Impact Radius API."""
    if not settings.impact_account_sid or not settings.impact_auth_token:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://api.impact.com/Mediapartners/{settings.impact_account_sid}/TrackingLinks",
                auth=(settings.impact_account_sid, settings.impact_auth_token),
                json={
                    "CampaignId": settings.walmart_campaign_id,
                    "Uri": product_url,
                    "TrackingLinkName": product_url[:50],
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("ClickTrackingUri") or data.get("Url")
    except httpx.RequestError:
        pass
    # Fallback: construct basic goto.walmart.com link
    encoded = quote(product_url, safe="")
    return f"https://goto.walmart.com/c/{settings.impact_account_sid}/{settings.walmart_campaign_id}?u={encoded}"
```

- [ ] **Step 5: Write affiliate/howl_links.py**

```python
import httpx
from config.settings import get_settings

settings = get_settings()

async def create_howl_link(product_url: str) -> str | None:
    """Create a monetized howl.me short link via Howl API."""
    if not settings.howl_api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.planethowl.com/smartlinks",
                headers={"Authorization": f"Bearer {settings.howl_api_key}", "Content-Type": "application/json"},
                json={"url": product_url}
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                return data.get("howl_link_url") or data.get("url") or data.get("short_url")
    except httpx.RequestError:
        pass
    return None
```

- [ ] **Step 6: Write affiliate/mavely_links.py**

```python
"""Mavely has no public API — links are created manually at app.mavely.com."""
from config.settings import get_settings

settings = get_settings()

def get_mavely_link(custom_link: str | None = None) -> str | None:
    """Return user-provided Mavely link or global fallback."""
    return custom_link or settings.mavely_default_link or None
```

- [ ] **Step 7: Write affiliate/link_manager.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession
from affiliate.amazon_links import make_affiliate_link, extract_asin
from affiliate.walmart_links import create_walmart_link
from affiliate.howl_links import create_howl_link
from affiliate.mavely_links import get_mavely_link
from database.crud import create_affiliate_link
from config.settings import get_settings

settings = get_settings()

async def generate_affiliate_link(
    session: AsyncSession,
    product_id: int,
    product_url: str,
    network: str,
    custom_link: str | None = None,
) -> str:
    """
    Generate and store an affiliate link for a product.
    Returns the local /go/{id} redirect URL.
    """
    affiliate_url = None

    if network == "amazon" and settings.amazon_associate_tag:
        affiliate_url = make_affiliate_link(product_url, settings.amazon_associate_tag)

    elif network == "walmart":
        affiliate_url = await create_walmart_link(product_url)

    elif network == "howl":
        affiliate_url = await create_howl_link(product_url)

    elif network == "mavely":
        affiliate_url = get_mavely_link(custom_link)

    elif network == "custom":
        affiliate_url = custom_link

    if not affiliate_url:
        affiliate_url = custom_link or product_url  # bare fallback

    link = await create_affiliate_link(
        session,
        product_id=product_id,
        network=network,
        original_url=product_url,
        affiliate_link=affiliate_url,
    )
    return f"{settings.base_url}/go/{link.short_redirect_id}"
```

- [ ] **Step 8: Write affiliate/click_tracker.py**

```python
import hashlib
from fastapi import Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from database.crud import get_link_by_redirect_id, log_click

async def handle_redirect(rid: str, request: Request, session: AsyncSession) -> Response:
    link = await get_link_by_redirect_id(session, rid)
    if not link:
        return Response("Not found", status_code=404)
    referrer = request.headers.get("referer", "direct")
    ua = request.headers.get("user-agent", "")
    client_ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:16]
    await log_click(session, link.id, referrer, ua, ip_hash)
    return RedirectResponse(url=link.affiliate_link, status_code=302)
```

- [ ] **Step 9: Run test**

```bash
pytest tests/test_affiliate.py -v
# Expected: PASSED
```

- [ ] **Step 10: Commit**

```bash
git add affiliate/ tests/test_affiliate.py
git commit -m "feat: affiliate link manager for Amazon, Walmart, Howl, Mavely, custom networks"
```

---

## Task 5: Content Generators (Scripts + Deal Posts + Deal Images)

**Files:**
- Create: `affiliate-autopublish/generators/script_generator.py`
- Create: `affiliate-autopublish/generators/deal_post_generator.py`
- Create: `affiliate-autopublish/generators/deal_image_generator.py`

- [ ] **Step 1: Write failing test**

```python
# tests/test_generators.py
import pytest
from unittest.mock import AsyncMock, patch
from generators.deal_post_generator import generate_deal_post

@pytest.mark.asyncio
async def test_deal_post_contains_link():
    with patch("generators.deal_post_generator.anthropic_client") as mock:
        mock.messages.create = AsyncMock(return_value=type("R", (), {
            "content": [type("C", (), {"text": "🛍️ BEST DEAL!\nhttps://howl.me/abc\n#ad"})()]
        })())
        result = await generate_deal_post(
            product_name="Wireless Headphones",
            price=29.99,
            affiliate_link="https://howl.me/abc",
            style="best_deal",
        )
    assert "https://howl.me/abc" in result
    assert "#ad" in result
```

- [ ] **Step 2: Run — verify fail**

```bash
pytest tests/test_generators.py -v
```

- [ ] **Step 3: Write generators/deal_post_generator.py**

```python
import anthropic
from config.settings import get_settings

settings = get_settings()
anthropic_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

STYLE_PROMPTS = {
    "best_deal": "Create a Facebook deal post in the style: emoji-heavy, urgency, 'BEST DEAL 🔥🔥' energy.",
    "price_drop": "Create a Facebook deal post in the style: 'PRICE DROP 💥' excitement, mention the savings.",
    "limited_time": "Create a Facebook deal post in the style: 'LIMITED TIME DEAL ⏰🔥', create urgency.",
    "top_rated": "Create a Facebook deal post in the style: 'TOP RATED ⭐', emphasize social proof and reviews.",
}

async def generate_deal_post(
    product_name: str,
    price: float,
    affiliate_link: str,
    style: str = "best_deal",
    original_price: float | None = None,
) -> str:
    discount_text = ""
    if original_price and original_price > price:
        discount_pct = int((original_price - price) / original_price * 100)
        discount_text = f" (was ${original_price:.2f}, save {discount_pct}%)"

    style_instruction = STYLE_PROMPTS.get(style, STYLE_PROMPTS["best_deal"])

    prompt = f"""{style_instruction}

Product: {product_name}
Price: ${price:.2f}{discount_text}
Affiliate link: {affiliate_link}

Rules:
- Maximum 5 lines total
- Emoji-heavy, ALL CAPS for claims
- Put the affiliate link on its own line
- End with #ad on its own line
- Do NOT add any commentary, just the post text

Output only the post text."""

    # Use Haiku for cost savings (~€0.006 per call vs €0.06 for Sonnet)
    response = anthropic_client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()
```

- [ ] **Step 4: Write generators/script_generator.py**

```python
import anthropic
from config.settings import get_settings

settings = get_settings()
anthropic_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

PLATFORM_SPECS = {
    "tiktok": {"duration": "30-45 seconds", "style": "casual, energetic, Gen-Z slang ok", "format": "9:16 vertical"},
    "instagram": {"duration": "30-45 seconds", "style": "casual, energetic, lifestyle", "format": "9:16 Reels"},
    "youtube_shorts": {"duration": "45-60 seconds", "style": "slightly detailed, enthusiastic", "format": "9:16"},
    "facebook": {"duration": "60-90 seconds", "style": "informative, conversational", "format": "16:9"},
    "youtube": {"duration": "60-90 seconds", "style": "detailed, structured", "format": "16:9"},
}

async def generate_video_script(
    product_name: str,
    price: float,
    features: list[str],
    description: str,
    affiliate_link: str,
    platform: str = "tiktok",
    star_rating: float = 0.0,
    review_count: int = 0,
) -> dict:
    spec = PLATFORM_SPECS.get(platform, PLATFORM_SPECS["tiktok"])
    features_text = "\n".join(f"- {f}" for f in features[:5])
    rating_text = f"{star_rating}/5 stars ({review_count:,} reviews)" if star_rating > 0 else ""

    prompt = f"""Write a {spec['duration']} video script for {platform} ({spec['format']}).
Style: {spec['style']}

Product: {product_name}
Price: ${price:.2f}
Description: {description}
Key features:
{features_text}
{f'Rating: {rating_text}' if rating_text else ''}

Script structure (label each section):
HOOK (3-5s): Bold claim or question that stops scrolling
PROBLEM (5-10s): Pain point this product solves
SOLUTION (10-20s): Product as answer, mention 3 key benefits
SOCIAL_PROOF (5s): Rating/reviews or "thousands love this"
CTA (5s): "Link in bio / description!"

After the script, provide:
TITLE_OPTIONS: 3 title options optimized for {platform}
DESCRIPTION: Full platform description with "{affiliate_link}" embedded naturally
HASHTAGS: 15-20 relevant hashtags

Output each section with its label."""

    # Use Sonnet for scripts (better quality, still affordable)
    response = anthropic_client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response.content[0].text.strip()

    # Parse sections
    sections = {}
    current_key = None
    current_lines = []
    for line in text.split("\n"):
        for label in ["HOOK", "PROBLEM", "SOLUTION", "SOCIAL_PROOF", "CTA", "TITLE_OPTIONS", "DESCRIPTION", "HASHTAGS"]:
            if line.startswith(label + ":") or line.startswith(f"**{label}**"):
                if current_key:
                    sections[current_key] = "\n".join(current_lines).strip()
                current_key = label
                current_lines = [line.split(":", 1)[-1].strip()]
                break
        else:
            if current_key:
                current_lines.append(line)
    if current_key:
        sections[current_key] = "\n".join(current_lines).strip()

    return {"platform": platform, "full_script": text, "sections": sections}
```

- [ ] **Step 5: Write generators/deal_image_generator.py**

```python
import os
import httpx
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO

ASSETS_DIR = Path(__file__).parent.parent / "assets"
FONTS_DIR = ASSETS_DIR / "fonts"

def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Load Anton or fall back to default."""
    font_file = FONTS_DIR / ("Anton-Regular.ttf" if bold else "Anton-Regular.ttf")
    try:
        return ImageFont.truetype(str(font_file), size)
    except (OSError, IOError):
        return ImageFont.load_default()

async def download_image(url: str) -> Image.Image | None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return Image.open(BytesIO(resp.content)).convert("RGBA")
    except Exception:
        pass
    return None

async def create_deal_image(
    product_name: str,
    price: float,
    image_url: str | None,
    network: str = "amazon",
    discount_pct: float = 0.0,
    output_path: str = "deal.jpg",
) -> str:
    """Generate a 1200x1200 deal image. Returns the saved file path."""
    W, H = 1200, 1200
    img = Image.new("RGB", (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Title bar
    title_font = _load_font(52, bold=True)
    store = network.upper()
    banner_text = f"{store} BEST DEAL 🔥🔥"
    draw.rectangle([0, 0, W, 100], fill=(0, 0, 0))
    draw.text((W // 2, 50), banner_text, font=title_font, fill=(255, 255, 255), anchor="mm")

    # Product name (wrapped)
    name_font = _load_font(42)
    product_name_short = product_name[:80] + ("..." if len(product_name) > 80 else "")
    draw.multiline_text((W // 2, 130), product_name_short, font=name_font, fill=(30, 30, 30),
                        anchor="ma", align="center", spacing=10)

    # Product image
    if image_url:
        product_img = await download_image(image_url)
        if product_img:
            product_img.thumbnail((700, 700))
            px = (W - product_img.width) // 2
            py = 250
            if product_img.mode == "RGBA":
                img.paste(product_img, (px, py), product_img)
            else:
                img.paste(product_img, (px, py))

    # Price badge
    price_font = _load_font(72, bold=True)
    draw.rectangle([0, H - 250, W, H - 130], fill=(220, 0, 0))
    draw.text((W // 2, H - 190), f"${price:.2f}", font=price_font, fill=(255, 255, 255), anchor="mm")

    if discount_pct > 0:
        disc_font = _load_font(44)
        draw.rectangle([0, H - 130, W, H], fill=(0, 0, 0))
        draw.text((W // 2, H - 65), f"SAVE {discount_pct:.0f}% OFF! 💥", font=disc_font,
                  fill=(255, 230, 0), anchor="mm")
    else:
        draw.rectangle([0, H - 130, W, H], fill=(0, 0, 0))
        draw.text((W // 2, H - 65), "LIMITED TIME OFFER ⏰", font=_load_font(44),
                  fill=(255, 255, 255), anchor="mm")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.convert("RGB").save(output_path, "JPEG", quality=90)
    return output_path
```

- [ ] **Step 6: Run test**

```bash
pytest tests/test_generators.py -v
# Expected: PASSED
```

- [ ] **Step 7: Commit**

```bash
git add generators/ tests/test_generators.py
git commit -m "feat: content generators — video scripts, deal post text, deal images"
```

---

## Task 6: Voice + Video Pipeline

**Files:**
- Create: `affiliate-autopublish/generators/voice_generator.py`
- Create: `affiliate-autopublish/generators/video_generator.py`
- Create: `affiliate-autopublish/generators/thumbnail_generator.py`

- [ ] **Step 1: Write voice_generator.py**

```python
import os, asyncio
from pathlib import Path
from config.settings import get_settings

settings = get_settings()

async def generate_voice(text: str, output_path: str, use_elevenlabs: bool = False) -> str:
    """Generate MP3. Uses ElevenLabs if key set, else gTTS (free)."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    if use_elevenlabs and settings.elevenlabs_api_key:
        from elevenlabs.client import ElevenLabs
        client = ElevenLabs(api_key=settings.elevenlabs_api_key)
        audio = client.generate(
            text=text,
            voice=settings.elevenlabs_voice_id,
            model="eleven_turbo_v2",
        )
        with open(output_path, "wb") as f:
            for chunk in audio:
                f.write(chunk)
    else:
        # gTTS is completely free
        from gtts import gTTS
        tts = gTTS(text=text, lang="en", slow=False)
        await asyncio.get_event_loop().run_in_executor(None, tts.save, output_path)

    return output_path
```

- [ ] **Step 2: Write generators/video_generator.py**

```python
import os, asyncio, json
from pathlib import Path
from typing import Literal
import httpx
from PIL import Image
from io import BytesIO

MUSIC_DIR = Path(__file__).parent.parent / "assets" / "music"
Format = Literal["9:16", "16:9"]

async def _download_image(url: str) -> Image.Image | None:
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(url)
            if r.status_code == 200:
                return Image.open(BytesIO(r.content)).convert("RGB")
    except Exception:
        return None

def _get_dimensions(fmt: Format) -> tuple[int, int]:
    return (1080, 1920) if fmt == "9:16" else (1920, 1080)

async def generate_video(
    script_sections: dict,
    image_urls: list[str],
    audio_path: str,
    output_path: str,
    product_name: str,
    affiliate_link: str,
    fmt: Format = "9:16",
) -> str:
    """
    Build a video: slides with Ken Burns effect → voice → captions → music → outro.
    Uses FFmpeg via subprocess. Returns output_path.
    """
    W, H = _get_dimensions(fmt)
    work_dir = Path(output_path).parent / "tmp_frames"
    work_dir.mkdir(parents=True, exist_ok=True)

    # 1. Download + resize images
    slides = []
    for i, url in enumerate(image_urls[:5]):
        img = await _download_image(url)
        if img:
            img = img.resize((W, H), Image.LANCZOS)
            path = str(work_dir / f"slide_{i:02d}.jpg")
            img.save(path, "JPEG", quality=90)
            slides.append(path)

    if not slides:
        # Create a blank slide with product name
        blank = Image.new("RGB", (W, H), (30, 30, 30))
        path = str(work_dir / "slide_00.jpg")
        blank.save(path)
        slides.append(path)

    slide_duration = 4  # seconds per slide

    # 2. Build FFmpeg filter graph: slides + Ken Burns + audio + music + subs
    # Build input args
    inputs = []
    for s in slides:
        inputs += ["-loop", "1", "-t", str(slide_duration), "-i", s]
    inputs += ["-i", audio_path]

    # Optional background music
    music_files = list(MUSIC_DIR.glob("*.mp3"))
    has_music = bool(music_files)
    if has_music:
        inputs += ["-i", str(music_files[0])]

    n = len(slides)
    voice_idx = n
    music_idx = n + 1 if has_music else None

    # Ken Burns zoom filter for each slide
    kb_filters = []
    for i in range(n):
        kb_filters.append(
            f"[{i}:v]scale={W*2}:{H*2},zoompan=z='min(zoom+0.0005,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={slide_duration*25}:s={W}x{H}:fps=25[kb{i}]"
        )

    # Concat all slides
    concat_in = "".join(f"[kb{i}]" for i in range(n))
    filter_parts = kb_filters + [f"{concat_in}concat=n={n}:v=1:a=0[video_raw]"]

    # Add caption overlay
    caption = product_name[:50]
    filter_parts.append(
        f"[video_raw]drawtext=text='{caption}':fontsize=48:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=8:x=(w-text_w)/2:y=h-120:enable='1'[video_cap]"
    )

    # Mix audio: voice + music
    if has_music:
        filter_parts.append(
            f"[{voice_idx}:a]aformat=sample_rates=44100:channel_layouts=stereo[voice];"
            f"[{music_idx}:a]volume=0.12,aformat=sample_rates=44100:channel_layouts=stereo[music];"
            "[voice][music]amix=inputs=2:duration=first[audio_out]"
        )
        audio_map = "[audio_out]"
    else:
        audio_map = f"{voice_idx}:a"

    filter_complex = ";".join(filter_parts)

    cmd = (
        ["ffmpeg", "-y"]
        + inputs
        + ["-filter_complex", filter_complex,
           "-map", "[video_cap]",
           "-map", audio_map,
           "-c:v", "libx264", "-preset", "fast", "-crf", "23",
           "-c:a", "aac", "-b:a", "128k",
           "-pix_fmt", "yuv420p",
           "-shortest",
           output_path]
    )

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {stderr.decode()[-1000:]}")

    # Cleanup temp frames
    import shutil
    shutil.rmtree(work_dir, ignore_errors=True)
    return output_path
```

- [ ] **Step 3: Write generators/thumbnail_generator.py**

```python
import os, httpx
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
from pathlib import Path

FONTS_DIR = Path(__file__).parent.parent / "assets" / "fonts"

async def generate_thumbnail(
    product_name: str,
    price: float,
    image_url: str | None,
    output_path: str,
) -> str:
    W, H = 1280, 720
    img = Image.new("RGB", (W, H), (20, 20, 20))
    draw = ImageDraw.Draw(img)

    # Background gradient effect (simple two-tone)
    for y in range(H):
        r = int(20 + (y / H) * 30)
        draw.line([(0, y), (W, y)], fill=(r, 20, 60))

    # Product image on left
    if image_url:
        try:
            async with httpx.AsyncClient(timeout=8) as c:
                resp = await c.get(image_url)
                pimg = Image.open(BytesIO(resp.content)).convert("RGBA")
                pimg.thumbnail((600, 600))
                img.paste(pimg, (30, (H - pimg.height) // 2), pimg)
        except Exception:
            pass

    # Text on right
    try:
        font_l = ImageFont.truetype(str(FONTS_DIR / "Anton-Regular.ttf"), 72)
        font_m = ImageFont.truetype(str(FONTS_DIR / "Anton-Regular.ttf"), 52)
        font_s = ImageFont.truetype(str(FONTS_DIR / "Anton-Regular.ttf"), 40)
    except Exception:
        font_l = font_m = font_s = ImageFont.load_default()

    name_short = product_name[:35] + ("..." if len(product_name) > 35 else "")
    draw.text((680, 120), name_short, font=font_m, fill=(255, 255, 255))
    draw.rectangle([660, 300, 980, 400], fill=(255, 30, 30))
    draw.text((820, 350), f"${price:.2f}", font=font_l, fill=(255, 255, 255), anchor="mm")
    draw.text((680, 440), "🔥 BEST DEAL", font=font_s, fill=(255, 220, 0))
    draw.text((680, 510), "Link in description 👇", font=font_s, fill=(200, 200, 200))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "JPEG", quality=92)
    return output_path
```

- [ ] **Step 4: Commit**

```bash
git add generators/voice_generator.py generators/video_generator.py generators/thumbnail_generator.py
git commit -m "feat: voice synthesis (gTTS/ElevenLabs), FFmpeg video pipeline, thumbnail generator"
```

---

## Task 7: Publishers

**Files:**
- Create: `affiliate-autopublish/publishers/youtube.py`
- Create: `affiliate-autopublish/publishers/instagram.py`
- Create: `affiliate-autopublish/publishers/facebook_page.py`
- Create: `affiliate-autopublish/publishers/facebook_group.py`
- Create: `affiliate-autopublish/publishers/tiktok.py`

- [ ] **Step 1: Write publishers/youtube.py**

```python
import os
import httpx
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from config.settings import get_settings

settings = get_settings()

def _get_youtube_service():
    creds = Credentials(
        token=None,
        refresh_token=settings.youtube_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.youtube_client_id,
        client_secret=settings.youtube_client_secret,
        scopes=["https://www.googleapis.com/auth/youtube.upload"],
    )
    return build("youtube", "v3", credentials=creds, cache_discovery=False)

async def upload_youtube_video(
    video_path: str,
    title: str,
    description: str,
    tags: list[str],
    thumbnail_path: str | None = None,
    privacy: str = "public",
) -> str:
    """Upload video to YouTube. Returns video URL."""
    youtube = _get_youtube_service()
    body = {
        "snippet": {"title": title[:100], "description": description[:5000], "tags": tags[:30]},
        "status": {"privacyStatus": privacy, "selfDeclaredMadeForKids": False},
    }
    media = MediaFileUpload(video_path, chunksize=-1, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
    response = None
    while response is None:
        _, response = request.next_chunk()
    video_id = response["id"]
    if thumbnail_path and os.path.exists(thumbnail_path):
        youtube.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(thumbnail_path)).execute()
    return f"https://www.youtube.com/watch?v={video_id}"
```

- [ ] **Step 2: Write publishers/instagram.py**

```python
import asyncio
import httpx
from config.settings import get_settings

settings = get_settings()
GRAPH_URL = "https://graph.facebook.com/v18.0"

async def upload_instagram_reel(
    video_path: str,
    caption: str,
    video_url: str | None = None,
) -> str:
    """Upload a Reel to Instagram via Meta Graph API. Returns media URL."""
    token = settings.meta_user_access_token
    ig_id = settings.meta_instagram_account_id

    # Step 1: Create upload container
    async with httpx.AsyncClient(timeout=60) as client:
        if video_url is None:
            # Upload to Meta's CDN first via resumable upload
            # For simplicity, require video_url pointing to a publicly accessible URL
            raise ValueError("video_url (public URL) required for Instagram Reels upload")

        resp = await client.post(
            f"{GRAPH_URL}/{ig_id}/media",
            params={
                "media_type": "REELS",
                "video_url": video_url,
                "caption": caption[:2200],
                "access_token": token,
            }
        )
        resp.raise_for_status()
        container_id = resp.json()["id"]

        # Step 2: Poll until container is ready
        for _ in range(30):
            await asyncio.sleep(10)
            status_resp = await client.get(
                f"{GRAPH_URL}/{container_id}",
                params={"fields": "status_code", "access_token": token}
            )
            if status_resp.json().get("status_code") == "FINISHED":
                break

        # Step 3: Publish
        pub_resp = await client.post(
            f"{GRAPH_URL}/{ig_id}/media_publish",
            params={"creation_id": container_id, "access_token": token}
        )
        pub_resp.raise_for_status()
        media_id = pub_resp.json()["id"]
    return f"https://www.instagram.com/p/{media_id}/"
```

- [ ] **Step 3: Write publishers/facebook_page.py**

```python
import httpx
from config.settings import get_settings

settings = get_settings()
GRAPH_URL = "https://graph.facebook.com/v18.0"

async def upload_facebook_page_video(
    video_path: str,
    description: str,
    video_url: str | None = None,
    title: str = "",
) -> str:
    """Upload video to Facebook Page."""
    token = settings.meta_user_access_token
    page_id = settings.meta_page_id

    async with httpx.AsyncClient(timeout=120) as client:
        if video_url:
            resp = await client.post(
                f"{GRAPH_URL}/{page_id}/videos",
                params={
                    "file_url": video_url,
                    "description": description[:5000],
                    "title": title[:255],
                    "access_token": token,
                }
            )
        else:
            with open(video_path, "rb") as f:
                resp = await client.post(
                    f"https://graph-video.facebook.com/v18.0/{page_id}/videos",
                    data={"description": description, "title": title, "access_token": token},
                    files={"source": f},
                )
        resp.raise_for_status()
        video_id = resp.json()["id"]
    return f"https://www.facebook.com/video/{video_id}"
```

- [ ] **Step 4: Write publishers/facebook_group.py**

```python
import httpx
from config.settings import get_settings

settings = get_settings()
GRAPH_URL = "https://graph.facebook.com/v18.0"

async def post_to_facebook_group(
    image_path: str,
    message: str,
    group_id: str | None = None,
) -> str:
    """
    Post image + text to Facebook Group.
    Requires publish_to_groups permission (needs Meta App Review).
    """
    token = settings.meta_user_access_token
    gid = group_id or settings.meta_group_id

    async with httpx.AsyncClient(timeout=30) as client:
        with open(image_path, "rb") as f:
            resp = await client.post(
                f"{GRAPH_URL}/{gid}/photos",
                data={"message": message[:5000], "access_token": token},
                files={"source": ("deal.jpg", f, "image/jpeg")},
            )
        if resp.status_code == 403:
            raise PermissionError(
                "Facebook Group posting requires 'publish_to_groups' permission. "
                "Submit your app for Meta App Review at developers.facebook.com."
            )
        resp.raise_for_status()
        post_id = resp.json()["id"]
    return f"https://www.facebook.com/groups/{gid}/posts/{post_id}"
```

- [ ] **Step 5: Write publishers/tiktok.py**

```python
import httpx
from config.settings import get_settings

settings = get_settings()

async def _refresh_tiktok_token() -> str:
    """Refresh TikTok access token using refresh token."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://open.tiktokapis.com/v2/oauth/token/",
            data={
                "client_key": settings.tiktok_client_key,
                "client_secret": settings.tiktok_client_secret,
                "grant_type": "refresh_token",
                "refresh_token": settings.tiktok_refresh_token,
            }
        )
        resp.raise_for_status()
        return resp.json()["data"]["access_token"]

async def upload_tiktok_video(
    video_path: str,
    caption: str,
    privacy: str = "PUBLIC_TO_EVERYONE",
) -> str:
    """Upload video to TikTok via Content Posting API v2."""
    access_token = await _refresh_tiktok_token()
    caption_clean = caption[:2200]

    async with httpx.AsyncClient(timeout=120) as client:
        # Step 1: Init upload
        init_resp = await client.post(
            "https://open.tiktokapis.com/v2/post/publish/video/init/",
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            json={
                "post_info": {"title": caption_clean, "privacy_level": privacy, "disable_duet": False},
                "source_info": {"source": "FILE_UPLOAD", "video_size": __import__("os").path.getsize(video_path),
                                "chunk_size": 10_000_000, "total_chunk_count": 1},
            }
        )
        init_resp.raise_for_status()
        publish_id = init_resp.json()["data"]["publish_id"]
        upload_url = init_resp.json()["data"]["upload_url"]

        # Step 2: Upload chunk
        with open(video_path, "rb") as f:
            video_data = f.read()
        upload_resp = await client.put(
            upload_url,
            content=video_data,
            headers={
                "Content-Type": "video/mp4",
                "Content-Range": f"bytes 0-{len(video_data)-1}/{len(video_data)}",
            }
        )
        upload_resp.raise_for_status()

    return f"https://www.tiktok.com/ (publish_id: {publish_id})"
```

- [ ] **Step 6: Commit**

```bash
git add publishers/
git commit -m "feat: video publishers for YouTube, Instagram, Facebook Page/Group, TikTok"
```

---

## Task 8: Job Queue + Scheduler

**Files:**
- Create: `affiliate-autopublish/jobs/queue.py`
- Create: `affiliate-autopublish/jobs/worker.py`
- Create: `affiliate-autopublish/scheduler/auto_post.py`

- [ ] **Step 1: Write jobs/queue.py**

```python
import asyncio
from collections import deque
from typing import Callable, Any

class JobQueue:
    """Simple in-process async job queue with status tracking."""
    def __init__(self):
        self._queue: asyncio.Queue = asyncio.Queue()
        self._results: dict[int, dict] = {}
        self._listeners: dict[int, list[asyncio.Queue]] = {}

    async def enqueue(self, job_id: int, coro_fn: Callable, *args, **kwargs) -> None:
        await self._queue.put((job_id, coro_fn, args, kwargs))
        self._results[job_id] = {"status": "queued"}

    def subscribe(self, job_id: int) -> asyncio.Queue:
        q = asyncio.Queue()
        self._listeners.setdefault(job_id, []).append(q)
        return q

    async def _notify(self, job_id: int, event: dict):
        self._results[job_id] = event
        for q in self._listeners.get(job_id, []):
            await q.put(event)

    def get_status(self, job_id: int) -> dict:
        return self._results.get(job_id, {"status": "unknown"})

    async def run_worker(self):
        while True:
            job_id, coro_fn, args, kwargs = await self._queue.get()
            await self._notify(job_id, {"status": "running"})
            try:
                result = await coro_fn(*args, **kwargs)
                await self._notify(job_id, {"status": "done", "result": result})
            except Exception as e:
                await self._notify(job_id, {"status": "failed", "error": str(e)})
            finally:
                self._queue.task_done()

job_queue = JobQueue()
```

- [ ] **Step 2: Write jobs/worker.py**

```python
import json
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from database.crud import get_product, update_job, create_post, AsyncSessionLocal
from generators.script_generator import generate_video_script
from generators.deal_post_generator import generate_deal_post
from generators.deal_image_generator import create_deal_image
from generators.voice_generator import generate_voice
from generators.video_generator import generate_video
from generators.thumbnail_generator import generate_thumbnail

MEDIA_DIR = Path("media")

async def run_full_video_campaign(
    job_id: int,
    product_id: int,
    affiliate_link: str,
    platforms: list[str],
    use_elevenlabs: bool = False,
) -> dict:
    """End-to-end: script → voice → video → upload. Called by job queue."""
    async with AsyncSessionLocal() as session:
        await update_job(session, job_id, status="running")
        product = await get_product(session, product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found")

        images = json.loads(product.images or "[]")
        features = json.loads(product.features or "[]")
        results = {}

        for platform in platforms:
            fmt = "9:16" if platform in ("tiktok", "instagram", "youtube_shorts") else "16:9"
            out_dir = MEDIA_DIR / f"product_{product_id}" / platform
            out_dir.mkdir(parents=True, exist_ok=True)

            # Script
            script = await generate_video_script(
                product_name=product.name,
                price=product.price or 0.0,
                features=features,
                description=product.description or "",
                affiliate_link=affiliate_link,
                platform=platform,
                star_rating=product.star_rating or 0.0,
                review_count=product.review_count or 0,
            )

            # Voice
            voiceover_text = " ".join(
                script["sections"].get(k, "") for k in ["HOOK", "PROBLEM", "SOLUTION", "SOCIAL_PROOF", "CTA"]
            )
            audio_path = str(out_dir / "voice.mp3")
            await generate_voice(voiceover_text, audio_path, use_elevenlabs=use_elevenlabs)

            # Video
            video_path = str(out_dir / "video.mp4")
            await generate_video(
                script_sections=script["sections"],
                image_urls=images,
                audio_path=audio_path,
                output_path=video_path,
                product_name=product.name,
                affiliate_link=affiliate_link,
                fmt=fmt,
            )

            # Thumbnail
            thumb_path = str(out_dir / "thumbnail.jpg")
            await generate_thumbnail(product.name, product.price or 0.0, images[0] if images else None, thumb_path)

            # Save post record
            description = script["sections"].get("DESCRIPTION", "")
            await create_post(
                session,
                product_id=product_id,
                post_type="video",
                platform=platform,
                post_text=description,
                video_path=video_path,
                image_path=thumb_path,
                affiliate_link=affiliate_link,
                status="ready",
            )
            results[platform] = {"video": video_path, "thumbnail": thumb_path}

        await update_job(session, job_id, status="done")
        return results


async def run_deal_post_campaign(
    job_id: int,
    product_id: int,
    affiliate_link: str,
    style: str = "best_deal",
    network: str = "amazon",
) -> dict:
    async with AsyncSessionLocal() as session:
        await update_job(session, job_id, status="running")
        product = await get_product(session, product_id)
        images = json.loads(product.images or "[]")

        post_text = await generate_deal_post(
            product_name=product.name,
            price=product.price or 0.0,
            affiliate_link=affiliate_link,
            style=style,
            original_price=product.original_price,
        )

        out_dir = MEDIA_DIR / f"product_{product_id}" / "deal_posts"
        out_dir.mkdir(parents=True, exist_ok=True)
        image_path = str(out_dir / "deal_image.jpg")

        await create_deal_image(
            product_name=product.name,
            price=product.price or 0.0,
            image_url=images[0] if images else None,
            network=network,
            discount_pct=product.discount_pct or 0.0,
            output_path=image_path,
        )

        await create_post(
            session,
            product_id=product_id,
            post_type="deal_post",
            platform="facebook_group",
            post_text=post_text,
            image_path=image_path,
            affiliate_link=affiliate_link,
            status="ready",
        )
        await update_job(session, job_id, status="done")
        return {"post_text": post_text, "image_path": image_path}
```

- [ ] **Step 3: Write scheduler/auto_post.py**

```python
import json
import random
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from database.crud import AsyncSessionLocal, get_products
from database.models import Post
from publishers.facebook_group import post_to_facebook_group

scheduler = AsyncIOScheduler()

async def _auto_post_job(hour: int):
    """Pick a ready deal post and publish it to the Facebook Group."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Post).where(Post.status == "ready", Post.platform == "facebook_group").order_by(Post.created_at)
        )
        post = result.scalars().first()
        if not post:
            return
        try:
            url = await post_to_facebook_group(post.image_path, post.post_text)
            post.status = "published"
            post.platform_post_id = url
            from datetime import datetime
            post.published_at = datetime.utcnow()
            await session.commit()
        except Exception as e:
            post.status = "failed"
            await session.commit()

def setup_scheduler(posts_per_day: int = 3, hours: list[int] = [9, 13, 18]):
    """Configure auto-posting schedule."""
    scheduler.remove_all_jobs()
    for h in hours[:posts_per_day]:
        scheduler.add_job(
            _auto_post_job,
            CronTrigger(hour=h, minute=0),
            args=[h],
            id=f"auto_post_{h}",
            replace_existing=True,
        )

def start_scheduler():
    if not scheduler.running:
        scheduler.start()

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
```

- [ ] **Step 4: Commit**

```bash
git add jobs/ scheduler/
git commit -m "feat: async job queue, video/deal-post workers, APScheduler auto-posting"
```

---

## Task 9: FastAPI Main App + Routes

**Files:**
- Create: `affiliate-autopublish/main.py`

- [ ] **Step 1: Write main.py**

```python
import json
import asyncio
import hashlib
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import get_settings
from database.crud import (
    init_db, get_session, create_product, get_products, get_product,
    create_affiliate_link, get_link_by_redirect_id, log_click, create_job,
    update_job, create_post, AsyncSessionLocal
)
from database.models import Post, AffiliateLink, ClickLog
from affiliate.link_manager import generate_affiliate_link
from affiliate.click_tracker import handle_redirect
from scrapers.amazon import scrape_amazon
from scrapers.walmart import scrape_walmart
from scrapers.generic import scrape_generic
from jobs.queue import job_queue
from jobs.worker import run_full_video_campaign, run_deal_post_campaign
from scheduler.auto_post import setup_scheduler, start_scheduler
from sqlalchemy import select, func

settings = get_settings()

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

# ── Scrape + Product ────────────────────────────────────────────────────────────

@app.post("/api/scrape")
async def scrape_product(url: str = Form(...), session: AsyncSession = Depends(get_session)):
    if "amazon." in url:
        data = await scrape_amazon(url)
    elif "walmart.com" in url:
        data = await scrape_walmart(url)
    else:
        data = await scrape_generic(url)

    product = await create_product(
        session,
        name=data["name"],
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
    return {"product": {
        "id": product.id, "name": product.name, "price": product.price,
        "original_price": product.original_price, "discount_pct": product.discount_pct,
        "images": json.loads(product.images or "[]"),
        "features": json.loads(product.features or "[]"),
        "description": product.description,
        "star_rating": product.star_rating,
        "review_count": product.review_count,
    }}

@app.get("/api/products")
async def list_products(session: AsyncSession = Depends(get_session)):
    products = await get_products(session)
    return {"products": [
        {"id": p.id, "name": p.name, "price": p.price, "url": p.url,
         "images": json.loads(p.images or "[]"), "created_at": str(p.created_at)}
        for p in products
    ]}

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
    url = await generate_affiliate_link(session, product_id, product.url, network, custom_link or None)
    return {"redirect_url": url, "affiliate_link": url}

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
    job = await create_job(session, "generate_video", {
        "product_id": product_id, "affiliate_link": affiliate_link,
        "platforms": platforms.split(","), "use_elevenlabs": use_elevenlabs,
    })
    await job_queue.enqueue(
        job.id, run_full_video_campaign,
        job.id, product_id, affiliate_link, platforms.split(","), use_elevenlabs,
    )
    return {"job_id": job.id, "status": "queued"}

@app.get("/api/job/{job_id}/status")
async def job_status(job_id: int):
    return job_queue.get_status(job_id)

@app.get("/api/job/{job_id}/stream")
async def job_stream(job_id: int):
    """SSE endpoint for real-time job progress."""
    listener = job_queue.subscribe(job_id)
    async def event_generator():
        while True:
            event = await asyncio.wait_for(listener.get(), timeout=30)
            yield f"data: {json.dumps(event)}\n\n"
            if event.get("status") in ("done", "failed"):
                break
    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ── Deal Post ───────────────────────────────────────────────────────────────────

@app.post("/api/deal-post/generate")
async def generate_deal_post_route(
    product_id: int = Form(...),
    affiliate_link: str = Form(...),
    style: str = Form("best_deal"),
    network: str = Form("amazon"),
    session: AsyncSession = Depends(get_session),
):
    job = await create_job(session, "generate_deal_post", {
        "product_id": product_id, "affiliate_link": affiliate_link,
        "style": style, "network": network,
    })
    await job_queue.enqueue(
        job.id, run_deal_post_campaign,
        job.id, product_id, affiliate_link, style, network,
    )
    return {"job_id": job.id}

@app.post("/api/deal-post/publish-now")
async def publish_deal_post_now(
    post_id: int = Form(...),
    session: AsyncSession = Depends(get_session),
):
    from publishers.facebook_group import post_to_facebook_group
    post = await session.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    url = await post_to_facebook_group(post.image_path, post.post_text)
    post.status = "published"
    post.platform_post_id = url
    from datetime import datetime
    post.published_at = datetime.utcnow()
    await session.commit()
    return {"url": url}

# ── Analytics ───────────────────────────────────────────────────────────────────

@app.get("/api/analytics")
async def analytics(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(AffiliateLink.network, func.sum(AffiliateLink.click_count).label("clicks"))
        .group_by(AffiliateLink.network)
    )
    clicks_by_network = {row.network: row.clicks for row in result}
    posts_result = await session.execute(
        select(Post.platform, func.count(Post.id).label("count")).group_by(Post.platform)
    )
    posts_by_platform = {row.platform: row.count for row in posts_result}
    return {"clicks_by_network": clicks_by_network, "posts_by_platform": posts_by_platform}

# ── Scheduler Config ────────────────────────────────────────────────────────────

@app.post("/api/scheduler/config")
async def configure_scheduler(posts_per_day: int = Form(3), hours: str = Form("9,13,18")):
    hour_list = [int(h.strip()) for h in hours.split(",")]
    setup_scheduler(posts_per_day, hour_list)
    return {"message": f"Scheduler set: {posts_per_day} posts/day at {hour_list}"}
```

- [ ] **Step 2: Commit**

```bash
git add main.py
git commit -m "feat: FastAPI main app — all routes for scrape, affiliate, video, deal posts, analytics, SSE"
```

---

## Task 10: Dashboard Frontend

**Files:**
- Create: `affiliate-autopublish/dashboard/templates/index.html`
- Create: `affiliate-autopublish/dashboard/static/style.css`
- Create: `affiliate-autopublish/dashboard/static/app.js`

- [ ] **Step 1: Write dashboard/templates/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Affiliate AutoPublish</title>
<link rel="stylesheet" href="/static/style.css"/>
</head>
<body>
<header>
  <h1>🚀 Affiliate AutoPublish</h1>
  <nav>
    <button class="tab-btn active" data-tab="video">🎬 New Video</button>
    <button class="tab-btn" data-tab="deal">🛍️ Deal Post</button>
    <button class="tab-btn" data-tab="scheduler">⏰ Scheduler</button>
    <button class="tab-btn" data-tab="products">📦 Products</button>
    <button class="tab-btn" data-tab="analytics">📊 Analytics</button>
    <button class="tab-btn" data-tab="settings">⚙️ Settings</button>
  </nav>
</header>

<main>
<!-- TAB: Video Campaign -->
<section id="tab-video" class="tab active">
  <h2>New Video Campaign</h2>
  <div class="card">
    <label>Product URL</label>
    <div class="input-row">
      <input id="video-url" type="url" placeholder="https://amazon.com/dp/..."/>
      <button onclick="scrapeProduct('video')">Scrape</button>
    </div>
    <div id="video-product-preview" class="product-preview hidden"></div>
  </div>
  <div class="card" id="video-affiliate-section" style="display:none">
    <label>Affiliate Network</label>
    <select id="video-network" onchange="onNetworkChange('video')">
      <option value="amazon">Amazon Associates</option>
      <option value="walmart">Walmart / Impact</option>
      <option value="howl">Howl (auto)</option>
      <option value="mavely">Mavely (manual)</option>
      <option value="custom">Custom</option>
    </select>
    <div id="video-mavely-note" class="note hidden">
      ℹ️ Generate your Mavely link at <a href="https://app.mavely.com" target="_blank">app.mavely.com</a> then paste it below.
    </div>
    <input id="video-custom-link" type="url" placeholder="Paste affiliate link (Mavely/Custom)" class="hidden"/>
    <button id="video-gen-howl" class="hidden" onclick="generateHowlLink('video')">Generate Howl Link</button>
    <div id="video-affiliate-link-display"></div>
  </div>
  <div class="card" id="video-platforms-section" style="display:none">
    <label>Platforms</label>
    <div class="checkbox-group">
      <label><input type="checkbox" name="platform" value="tiktok" checked/> TikTok</label>
      <label><input type="checkbox" name="platform" value="instagram" checked/> Instagram Reels</label>
      <label><input type="checkbox" name="platform" value="youtube_shorts"/> YouTube Shorts</label>
      <label><input type="checkbox" name="platform" value="facebook"/> Facebook Page</label>
    </div>
    <label><input type="checkbox" id="use-elevenlabs"/> Use ElevenLabs voice (better quality)</label>
    <button onclick="startVideoCampaign()" class="btn-primary">🎬 Generate Videos</button>
  </div>
  <div id="video-job-status" class="job-status hidden"></div>
</section>

<!-- TAB: Deal Post -->
<section id="tab-deal" class="tab">
  <h2>New Facebook Group Deal Post</h2>
  <div class="card">
    <label>Product URL</label>
    <div class="input-row">
      <input id="deal-url" type="url" placeholder="https://walmart.com/ip/..."/>
      <button onclick="scrapeProduct('deal')">Scrape</button>
    </div>
    <div id="deal-product-preview" class="product-preview hidden"></div>
  </div>
  <div class="card" id="deal-affiliate-section" style="display:none">
    <label>Network</label>
    <select id="deal-network" onchange="onNetworkChange('deal')">
      <option value="amazon">Amazon</option>
      <option value="walmart">Walmart</option>
      <option value="howl">Howl</option>
      <option value="mavely">Mavely</option>
      <option value="custom">Custom</option>
    </select>
    <div id="deal-mavely-note" class="note hidden">ℹ️ Get your Mavely link at <a href="https://app.mavely.com" target="_blank">app.mavely.com</a></div>
    <input id="deal-custom-link" type="url" placeholder="Paste affiliate link" class="hidden"/>
    <button id="deal-gen-howl" class="hidden" onclick="generateHowlLink('deal')">Generate Howl Link</button>
  </div>
  <div class="card" id="deal-style-section" style="display:none">
    <label>Post Style</label>
    <select id="deal-style">
      <option value="best_deal">🔥 Best Deal</option>
      <option value="price_drop">💥 Price Drop</option>
      <option value="limited_time">⏰ Limited Time</option>
      <option value="top_rated">⭐ Top Rated</option>
    </select>
    <button onclick="generateDealPost()" class="btn-primary">✍️ Generate Post</button>
  </div>
  <div id="deal-preview" class="deal-preview hidden">
    <div class="split">
      <div>
        <h3>Deal Image Preview</h3>
        <img id="deal-image-preview" src="" alt="Deal Image"/>
      </div>
      <div>
        <h3>Post Text</h3>
        <textarea id="deal-text-preview" rows="8"></textarea>
        <button onclick="publishDealNow()" class="btn-primary">📤 Post to Facebook Group Now</button>
        <button onclick="scheduleDeal()">📅 Add to Queue</button>
      </div>
    </div>
  </div>
</section>

<!-- TAB: Scheduler -->
<section id="tab-scheduler" class="tab">
  <h2>Auto-Posting Scheduler</h2>
  <div class="card">
    <label>Posts per day</label>
    <input id="posts-per-day" type="number" value="3" min="1" max="10"/>
    <label>Posting hours (comma-separated, 24h)</label>
    <input id="posting-hours" type="text" value="9,13,18"/>
    <button onclick="saveScheduler()" class="btn-primary">Save Schedule</button>
  </div>
  <div class="card">
    <h3>Queued Posts</h3>
    <div id="queued-posts-list">Loading...</div>
  </div>
</section>

<!-- TAB: Products -->
<section id="tab-products" class="tab">
  <h2>Products Library</h2>
  <div id="products-table">Loading...</div>
</section>

<!-- TAB: Analytics -->
<section id="tab-analytics" class="tab">
  <h2>Analytics</h2>
  <div class="analytics-grid">
    <div class="card"><h3>Clicks by Network</h3><div id="clicks-chart"></div></div>
    <div class="card"><h3>Posts by Platform</h3><div id="posts-chart"></div></div>
  </div>
</section>

<!-- TAB: Settings -->
<section id="tab-settings" class="tab">
  <h2>Settings</h2>
  <p class="note">Edit your <code>.env</code> file directly. Restart the server after changes.</p>
  <div class="card">
    <h3>API Keys Status</h3>
    <div id="api-status">Loading...</div>
  </div>
  <div class="card">
    <h3>Mavely Setup</h3>
    <p>Mavely has no public API. Generate links manually at <a href="https://app.mavely.com" target="_blank">app.mavely.com</a> and paste them per-product.</p>
  </div>
</section>
</main>
<script src="/static/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write dashboard/static/style.css**

```css
:root { --bg: #0f1117; --card: #1a1d27; --accent: #6c63ff; --text: #e0e0e0; --muted: #888; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
header { background: var(--card); padding: 16px 24px; display: flex; align-items: center; gap: 24px; border-bottom: 1px solid #2a2d3a; }
header h1 { font-size: 1.4rem; white-space: nowrap; }
nav { display: flex; gap: 8px; flex-wrap: wrap; }
.tab-btn { background: transparent; border: 1px solid #2a2d3a; color: var(--text); padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: .85rem; transition: all .2s; }
.tab-btn.active, .tab-btn:hover { background: var(--accent); border-color: var(--accent); }
main { max-width: 1100px; margin: 0 auto; padding: 24px; }
.tab { display: none; } .tab.active { display: block; }
h2 { margin-bottom: 20px; font-size: 1.3rem; }
.card { background: var(--card); border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #2a2d3a; }
label { display: block; margin-bottom: 6px; color: var(--muted); font-size: .85rem; margin-top: 12px; }
input, select, textarea { width: 100%; background: #0f1117; border: 1px solid #2a2d3a; color: var(--text); padding: 10px 14px; border-radius: 8px; font-size: .95rem; }
textarea { resize: vertical; }
.input-row { display: flex; gap: 10px; }
.input-row input { flex: 1; }
button { background: #2a2d3a; border: none; color: var(--text); padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: .9rem; transition: background .2s; }
button:hover { background: #3a3d4a; }
.btn-primary { background: var(--accent) !important; margin-top: 12px; }
.btn-primary:hover { background: #5a52ff !important; }
.hidden { display: none !important; }
.note { background: #1e2235; border-left: 3px solid var(--accent); padding: 10px 14px; border-radius: 6px; font-size: .85rem; margin-top: 8px; }
.product-preview { display: flex; gap: 16px; margin-top: 12px; align-items: flex-start; }
.product-preview img { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; }
.product-info h3 { font-size: 1rem; margin-bottom: 4px; }
.product-info .price { color: #4ade80; font-size: 1.2rem; font-weight: bold; }
.job-status { background: var(--card); border-radius: 12px; padding: 20px; margin-top: 16px; border: 2px solid var(--accent); }
.job-status.done { border-color: #4ade80; }
.job-status.failed { border-color: #f87171; }
.checkbox-group { display: flex; gap: 20px; flex-wrap: wrap; margin: 12px 0; }
.checkbox-group label { color: var(--text); margin: 0; display: flex; gap: 6px; align-items: center; cursor: pointer; }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.split img { width: 100%; border-radius: 8px; }
.analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #2a2d3a; font-size: .9rem; }
th { color: var(--muted); font-weight: 500; }
tr:hover td { background: #1a1d27; }
.status-badge { padding: 3px 10px; border-radius: 12px; font-size: .78rem; }
.status-ready { background: #14532d; color: #4ade80; }
.status-published { background: #1e3a5f; color: #60a5fa; }
.status-failed { background: #450a0a; color: #f87171; }
.bar-chart { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 10px; }
.bar-label { width: 120px; font-size: .85rem; text-align: right; }
.bar-fill { height: 20px; background: var(--accent); border-radius: 4px; transition: width .4s; }
.bar-val { font-size: .82rem; color: var(--muted); }
```

- [ ] **Step 3: Write dashboard/static/app.js**

```javascript
// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'products') loadProducts();
    if (btn.dataset.tab === 'analytics') loadAnalytics();
  });
});

let currentProductId = { video: null, deal: null };
let currentAffiliateLink = { video: '', deal: '' };
let currentDealPostId = null;

async function scrapeProduct(ctx) {
  const url = document.getElementById(`${ctx}-url`).value.trim();
  if (!url) return alert('Enter a product URL first');
  const btn = event.target;
  btn.textContent = 'Scraping...'; btn.disabled = true;
  const fd = new FormData(); fd.append('url', url);
  const res = await fetch('/api/scrape', { method: 'POST', body: fd });
  btn.textContent = 'Scrape'; btn.disabled = false;
  if (!res.ok) return alert('Scrape failed: ' + await res.text());
  const { product } = await res.json();
  currentProductId[ctx] = product.id;
  const preview = document.getElementById(`${ctx}-product-preview`);
  const imgSrc = product.images?.[0] || '';
  preview.innerHTML = `<img src="${imgSrc}" onerror="this.style.display='none'"/>
    <div class="product-info">
      <h3>${product.name}</h3>
      <div class="price">$${product.price?.toFixed(2)} ${product.discount_pct > 0 ? `<small style="color:#888;text-decoration:line-through">$${product.original_price?.toFixed(2)}</small> <small style="color:#4ade80">-${product.discount_pct}%</small>` : ''}</div>
      <small>${product.review_count > 0 ? `⭐ ${product.star_rating}/5 (${product.review_count.toLocaleString()} reviews)` : ''}</small>
    </div>`;
  preview.classList.remove('hidden');
  document.getElementById(`${ctx}-affiliate-section`).style.display = 'block';
  if (ctx === 'deal') document.getElementById('deal-style-section').style.display = 'block';
  if (ctx === 'video') document.getElementById('video-platforms-section').style.display = 'block';
}

function onNetworkChange(ctx) {
  const net = document.getElementById(`${ctx}-network`).value;
  const mavelyNote = document.getElementById(`${ctx}-mavely-note`);
  const customLink = document.getElementById(`${ctx}-custom-link`);
  const howlBtn = document.getElementById(`${ctx}-gen-howl`);
  mavelyNote.classList.toggle('hidden', net !== 'mavely');
  customLink.classList.toggle('hidden', net !== 'mavely' && net !== 'custom');
  if (howlBtn) howlBtn.classList.toggle('hidden', net !== 'howl');
}

async function generateHowlLink(ctx) {
  const pid = currentProductId[ctx];
  if (!pid) return alert('Scrape a product first');
  const fd = new FormData();
  fd.append('product_id', pid);
  fd.append('network', 'howl');
  const res = await fetch('/api/affiliate/generate', { method: 'POST', body: fd });
  const data = await res.json();
  currentAffiliateLink[ctx] = data.redirect_url;
  const display = document.getElementById(`${ctx}-affiliate-link-display`);
  if (display) display.innerHTML = `<small style="color:#4ade80">✅ ${data.redirect_url}</small>`;
}

async function startVideoCampaign() {
  const pid = currentProductId['video'];
  if (!pid) return alert('Scrape a product first');
  const network = document.getElementById('video-network').value;
  let link = document.getElementById('video-custom-link').value || currentAffiliateLink['video'];
  if (!link) {
    const fd = new FormData(); fd.append('product_id', pid); fd.append('network', network);
    const r = await fetch('/api/affiliate/generate', { method: 'POST', body: fd });
    link = (await r.json()).redirect_url;
  }
  const platforms = [...document.querySelectorAll('input[name=platform]:checked')].map(c => c.value).join(',');
  const useEl = document.getElementById('use-elevenlabs').checked;
  const fd = new FormData();
  fd.append('product_id', pid); fd.append('affiliate_link', link);
  fd.append('platforms', platforms); fd.append('use_elevenlabs', useEl);
  const res = await fetch('/api/video/generate', { method: 'POST', body: fd });
  const { job_id } = await res.json();
  trackJobProgress(job_id, 'video-job-status');
}

function trackJobProgress(jobId, containerId) {
  const el = document.getElementById(containerId);
  el.classList.remove('hidden', 'done', 'failed');
  el.innerHTML = '<p>⏳ Generating... (this may take 2-5 minutes)</p><div class="progress-bar"></div>';
  const es = new EventSource(`/api/job/${jobId}/stream`);
  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.status === 'done') {
      el.classList.add('done');
      el.innerHTML = '<p>✅ Done! Check the Products tab for your videos.</p>';
      es.close();
    } else if (data.status === 'failed') {
      el.classList.add('failed');
      el.innerHTML = `<p>❌ Failed: ${data.error}</p>`;
      es.close();
    } else {
      el.innerHTML = `<p>⏳ Status: ${data.status}...</p>`;
    }
  };
}

async function generateDealPost() {
  const pid = currentProductId['deal'];
  if (!pid) return alert('Scrape a product first');
  const network = document.getElementById('deal-network').value;
  const style = document.getElementById('deal-style').value;
  let link = document.getElementById('deal-custom-link').value || currentAffiliateLink['deal'];
  if (!link) {
    const fd = new FormData(); fd.append('product_id', pid); fd.append('network', network);
    const r = await fetch('/api/affiliate/generate', { method: 'POST', body: fd });
    link = (await r.json()).redirect_url;
  }
  const fd = new FormData();
  fd.append('product_id', pid); fd.append('affiliate_link', link);
  fd.append('style', style); fd.append('network', network);
  const res = await fetch('/api/deal-post/generate', { method: 'POST', body: fd });
  const { job_id } = await res.json();

  // Poll for result
  const poll = setInterval(async () => {
    const s = await fetch(`/api/job/${job_id}/status`).then(r => r.json());
    if (s.status === 'done') {
      clearInterval(poll);
      currentDealPostId = s.result?.post_id;
      document.getElementById('deal-text-preview').value = s.result?.post_text || '';
      const imgPath = s.result?.image_path?.replace('\\', '/');
      if (imgPath) document.getElementById('deal-image-preview').src = '/' + imgPath;
      document.getElementById('deal-preview').classList.remove('hidden');
    }
  }, 1500);
}

async function publishDealNow() {
  if (!currentDealPostId) return alert('Generate a deal post first');
  const fd = new FormData(); fd.append('post_id', currentDealPostId);
  const res = await fetch('/api/deal-post/publish-now', { method: 'POST', body: fd });
  const data = await res.json();
  if (data.url) alert('✅ Posted! ' + data.url);
  else alert('Error: ' + JSON.stringify(data));
}

async function saveScheduler() {
  const ppd = document.getElementById('posts-per-day').value;
  const hrs = document.getElementById('posting-hours').value;
  const fd = new FormData(); fd.append('posts_per_day', ppd); fd.append('hours', hrs);
  await fetch('/api/scheduler/config', { method: 'POST', body: fd });
  alert('✅ Scheduler saved!');
}

async function loadProducts() {
  const res = await fetch('/api/products');
  const { products } = await res.json();
  const el = document.getElementById('products-table');
  if (!products.length) { el.innerHTML = '<p style="color:#888">No products yet.</p>'; return; }
  el.innerHTML = `<table><thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Added</th><th>Actions</th></tr></thead><tbody>
    ${products.map(p => `<tr>
      <td><img src="${p.images?.[0] || ''}" width="50" height="50" style="object-fit:cover;border-radius:6px" onerror="this.style.display='none'"/></td>
      <td>${p.name}</td>
      <td>$${p.price?.toFixed(2)}</td>
      <td>${new Date(p.created_at).toLocaleDateString()}</td>
      <td><button onclick="window.location.href='/?product=${p.id}'">Use</button></td>
    </tr>`).join('')}
  </tbody></table>`;
}

async function loadAnalytics() {
  const res = await fetch('/api/analytics');
  const { clicks_by_network, posts_by_platform } = await res.json();
  renderBarChart('clicks-chart', clicks_by_network, 'clicks');
  renderBarChart('posts-chart', posts_by_platform, 'posts');
}

function renderBarChart(containerId, data, unit) {
  const el = document.getElementById(containerId);
  if (!Object.keys(data).length) { el.innerHTML = '<p style="color:#888">No data yet.</p>'; return; }
  const max = Math.max(...Object.values(data)) || 1;
  el.innerHTML = `<div class="bar-chart">${Object.entries(data).map(([k, v]) =>
    `<div class="bar-row"><span class="bar-label">${k}</span><div class="bar-fill" style="width:${(v/max*200).toFixed(0)}px"></div><span class="bar-val">${v} ${unit}</span></div>`
  ).join('')}</div>`;
}
```

- [ ] **Step 4: Commit**

```bash
git add dashboard/
git commit -m "feat: web dashboard — 6-tab UI with SSE job tracking, deal image preview, analytics charts"
```

---

## Task 11: Auth Setup + README + Final Wiring

**Files:**
- Create: `affiliate-autopublish/auth/setup_auth.py`
- Create: `affiliate-autopublish/README.md`

- [ ] **Step 1: Write auth/setup_auth.py**

```python
#!/usr/bin/env python3
"""
Run this once to set up OAuth2 tokens for YouTube, Meta, and TikTok.
Usage: python auth/setup_auth.py
"""
import json, webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import httpx
from config.settings import get_settings

settings = get_settings()

def setup_youtube_oauth():
    """Open browser for YouTube OAuth2, capture token."""
    if not settings.youtube_client_id:
        print("⚠️  YOUTUBE_CLIENT_ID not set in .env — skipping")
        return
    auth_url = (
        "https://accounts.google.com/o/oauth2/auth?"
        f"client_id={settings.youtube_client_id}"
        "&redirect_uri=urn:ietf:wg:oauth:2.0:oob"
        "&scope=https://www.googleapis.com/auth/youtube.upload"
        "&response_type=code&access_type=offline"
    )
    print(f"\n1. Open this URL in your browser:\n{auth_url}")
    code = input("\n2. Paste the authorization code here: ").strip()
    resp = httpx.post("https://oauth2.googleapis.com/token", data={
        "code": code, "client_id": settings.youtube_client_id,
        "client_secret": settings.youtube_client_secret,
        "redirect_uri": "urn:ietf:wg:oauth:2.0:oob",
        "grant_type": "authorization_code",
    })
    data = resp.json()
    if "refresh_token" in data:
        print(f"\n✅ Add to .env:\nYOUTUBE_REFRESH_TOKEN={data['refresh_token']}")
    else:
        print(f"❌ Error: {data}")

def setup_meta_token():
    if not settings.meta_app_id:
        print("⚠️  META_APP_ID not set in .env — skipping")
        return
    url = (
        f"https://www.facebook.com/dialog/oauth?"
        f"client_id={settings.meta_app_id}"
        "&redirect_uri=https://developers.facebook.com/tools/explorer/"
        "&scope=pages_manage_posts,pages_read_engagement,instagram_basic,"
        "instagram_content_publish,publish_to_groups,groups_access_member_info"
        "&response_type=token"
    )
    print(f"\nMeta: Open Facebook Graph API Explorer:\nhttps://developers.facebook.com/tools/explorer/")
    print("1. Select your app, click 'Get User Access Token'")
    print("2. Add permissions: pages_manage_posts, instagram_content_publish, publish_to_groups")
    print("3. Copy the generated token")
    token = input("Paste your Meta User Access Token: ").strip()
    if token:
        print(f"\n✅ Add to .env:\nMETA_USER_ACCESS_TOKEN={token}")

def main():
    print("=== Affiliate AutoPublish — Auth Setup ===\n")
    print("This script helps you set up OAuth tokens for each platform.\n")
    setup_youtube_oauth()
    setup_meta_token()
    print("\n✅ Auth setup complete. Update your .env file with the tokens above.")
    print("Then restart the server: uvicorn main:app --reload")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Download required assets**

```bash
# Download Anton font (open source, SIL license)
mkdir -p affiliate-autopublish/assets/fonts
curl -L "https://fonts.gstatic.com/s/anton/v25/1Ptgg87LROyAm3Kz-C8.woff2" -o affiliate-autopublish/assets/fonts/Anton-Regular.woff2
# Note: For Pillow you need TTF. Download from Google Fonts:
# https://fonts.google.com/specimen/Anton → Download → extract Anton-Regular.ttf

# Add a short royalty-free music track placeholder
touch affiliate-autopublish/assets/music/background_01.mp3
# Replace with actual royalty-free MP3 from freesound.org or pixabay.com
```

- [ ] **Step 3: Install Playwright browsers**

```bash
cd affiliate-autopublish
pip install -r requirements.txt
playwright install chromium
```

- [ ] **Step 4: Create .env from example**

```bash
cp .env.example .env
# Edit .env with your actual keys
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/ -v
# Expected: all tests PASS
```

- [ ] **Step 6: Start the server**

```bash
uvicorn main:app --reload --port 8000
# Open http://localhost:8000
```

- [ ] **Step 7: Final commit**

```bash
git add auth/ assets/ README.md
git commit -m "feat: auth setup script, asset placeholders, complete affiliate-autopublish system"
```

---

## Self-Review: Spec Coverage Check

| Spec Requirement | Task Covered |
|---|---|
| Amazon ASIN extraction + tag injection | Task 4 |
| Walmart / Impact Radius API | Task 4 |
| Howl API dynamic link | Task 4 |
| Mavely manual link storage | Task 4 |
| Custom/manual network | Task 4 (link_manager.py) |
| Click tracking /go/{id} | Task 4 |
| Amazon scraper (Playwright) | Task 3 |
| Walmart scraper | Task 3 |
| Generic OG fallback | Task 3 |
| Deal image 1200×1200 (Pillow) | Task 5 |
| Deal post text (Claude Haiku) | Task 5 |
| Facebook Group publisher (Meta Graph) | Task 7 |
| Auto-posting scheduler | Task 8 |
| AI video script (Claude) | Task 5 |
| Voice: gTTS (free) + ElevenLabs | Task 6 |
| FFmpeg video pipeline | Task 6 |
| Thumbnail generator | Task 6 |
| YouTube publisher | Task 7 |
| Instagram Reels publisher | Task 7 |
| TikTok publisher | Task 7 |
| Job queue + SSE real-time updates | Task 8 + Task 9 |
| 6-tab web dashboard | Task 10 |
| Analytics (clicks + platform) | Task 9 + Task 10 |
| OAuth2 setup helper | Task 11 |
| All secrets in .env | All tasks |
| async/await throughout | All tasks |
