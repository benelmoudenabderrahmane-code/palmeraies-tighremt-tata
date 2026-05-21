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
    features = Column(Text)       # JSON list
    star_rating = Column(Float)
    review_count = Column(Integer)
    url = Column(String(2000), nullable=False)
    images = Column(Text)         # JSON list of URLs
    created_at = Column(DateTime, default=datetime.utcnow)

    links = relationship("AffiliateLink", back_populates="product", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="product", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="product")


class AffiliateLink(Base):
    __tablename__ = "affiliate_links"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    network = Column(String(50), nullable=False)   # howl/amazon/mavely/custom
    original_url = Column(String(2000))
    affiliate_link = Column(String(2000), nullable=False)
    short_redirect_id = Column(String(20), unique=True, nullable=False)
    click_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime)

    product = relationship("Product", back_populates="links")
    clicks = relationship("ClickLog", back_populates="link", cascade="all, delete-orphan")


class ClickLog(Base):
    __tablename__ = "click_logs"

    id = Column(Integer, primary_key=True)
    link_id = Column(Integer, ForeignKey("affiliate_links.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    referrer = Column(String(500))   # direct or URL
    platform = Column(String(50))    # youtube/instagram/facebook/tiktok/group/unknown
    user_agent = Column(String(500))
    ip_hash = Column(String(64))     # anonymized SHA-256 prefix

    link = relationship("AffiliateLink", back_populates="clicks")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)   # nullable for shoe_short posts
    post_type = Column(String(20))   # video / deal_post / shoe_short
    platform = Column(String(50))    # youtube/instagram/facebook_page/facebook_group/tiktok
    post_text = Column(Text)
    image_path = Column(String(500))
    video_path = Column(String(500))
    affiliate_network = Column(String(50))
    affiliate_link = Column(String(2000))
    status = Column(String(20), default="pending")  # pending/ready/published/failed
    platform_post_id = Column(String(200))
    scheduled_at = Column(DateTime)
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="posts")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True)
    job_type = Column(String(50))   # scrape/generate_video/generate_post/publish
    status = Column(String(20), default="queued")  # queued/running/done/failed
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    params = Column(Text)   # JSON
    result = Column(Text)   # JSON
    error = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="jobs")
