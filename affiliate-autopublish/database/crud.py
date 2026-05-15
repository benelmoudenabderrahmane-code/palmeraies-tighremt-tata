import json
import secrets
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func

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


# ── Products ───────────────────────────────────────────────────────────────────

async def create_product(session: AsyncSession, **kwargs) -> Product:
    p = Product(**kwargs)
    session.add(p)
    await session.commit()
    await session.refresh(p)
    return p


async def get_products(session: AsyncSession) -> list[Product]:
    result = await session.execute(
        select(Product).order_by(Product.created_at.desc())
    )
    return list(result.scalars().all())


async def get_product(session: AsyncSession, product_id: int) -> Product | None:
    return await session.get(Product, product_id)


# ── Affiliate Links ─────────────────────────────────────────────────────────────

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


async def log_click(
    session: AsyncSession,
    link_id: int,
    referrer: str,
    platform: str,
    ua: str,
    ip_hash: str,
):
    log = ClickLog(
        link_id=link_id,
        referrer=referrer,
        platform=platform,
        user_agent=ua,
        ip_hash=ip_hash,
    )
    session.add(log)
    link = await session.get(AffiliateLink, link_id)
    if link:
        link.click_count = (link.click_count or 0) + 1
        link.last_used_at = datetime.utcnow()
    await session.commit()


async def get_clicks_by_network(session: AsyncSession) -> dict:
    result = await session.execute(
        select(AffiliateLink.network, func.sum(AffiliateLink.click_count).label("clicks"))
        .group_by(AffiliateLink.network)
    )
    return {row.network: int(row.clicks or 0) for row in result}


# ── Posts ───────────────────────────────────────────────────────────────────────

async def create_post(session: AsyncSession, **kwargs) -> Post:
    post = Post(**kwargs)
    session.add(post)
    await session.commit()
    await session.refresh(post)
    return post


async def get_posts(session: AsyncSession, status: str | None = None) -> list[Post]:
    q = select(Post).order_by(Post.created_at.desc())
    if status:
        q = q.where(Post.status == status)
    result = await session.execute(q)
    return list(result.scalars().all())


async def get_posts_by_platform(session: AsyncSession) -> dict:
    result = await session.execute(
        select(Post.platform, func.count(Post.id).label("count")).group_by(Post.platform)
    )
    return {row.platform: row.count for row in result}


# ── Jobs ────────────────────────────────────────────────────────────────────────

async def create_job(session: AsyncSession, job_type: str, params: dict, product_id: int | None = None) -> Job:
    job = Job(job_type=job_type, params=json.dumps(params), product_id=product_id)
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return job


async def update_job(session: AsyncSession, job_id: int, **kwargs):
    job = await session.get(Job, job_id)
    if job:
        for k, v in kwargs.items():
            setattr(job, k, v)
        job.updated_at = datetime.utcnow()
        await session.commit()
