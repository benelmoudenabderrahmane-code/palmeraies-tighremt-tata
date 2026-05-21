import json
from pathlib import Path

from database.crud import get_product, update_job, create_post, AsyncSessionLocal
from generators.script_generator import generate_video_script
from generators.deal_post_generator import generate_deal_post
from generators.deal_image_generator import create_deal_image
from generators.voice_generator import generate_voice
from generators.video_generator import generate_video
from generators.thumbnail_generator import generate_thumbnail
from generators.youtube_seo import generate_youtube_metadata
from generators.shoe_short_generator import generate_shoe_short
from generators.shoe_vision_analyzer import analyze_shoe_photos
from generators.shoe_script_generator import generate_shoe_script
from publishers.n8n_webhook import send_to_n8n
from publishers.youtube_publisher import upload_to_youtube

MEDIA_DIR = Path("media")


async def run_full_video_campaign(
    job_id: int,
    product_id: int,
    affiliate_link: str,
    platforms: list[str],
    use_elevenlabs: bool = False,
) -> dict:
    """
    Full pipeline: script → voice → video → thumbnail → save post record.
    Called by the job queue worker.
    """
    async with AsyncSessionLocal() as session:
        await update_job(session, job_id, status="running")

        product = await get_product(session, product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found")

        images = json.loads(product.images or "[]")
        features = json.loads(product.features or "[]")
        results: dict[str, dict] = {}

        for platform in platforms:
            fmt = "9:16" if platform in ("tiktok", "instagram", "youtube_shorts") else "16:9"
            out_dir = MEDIA_DIR / f"product_{product_id}" / platform
            out_dir.mkdir(parents=True, exist_ok=True)

            # 1. Generate script
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

            # 2. Build voiceover text from script sections
            voiceover_text = " ".join(
                script["sections"].get(k, "")
                for k in ["HOOK", "PROBLEM", "SOLUTION", "SOCIAL_PROOF", "CTA"]
            ).strip()
            if not voiceover_text:
                voiceover_text = f"{product.name}. Only ${product.price:.2f}. Link in description!"

            audio_path = str(out_dir / "voice.mp3")
            await generate_voice(voiceover_text, audio_path, use_elevenlabs=use_elevenlabs)

            # 3. Generate video
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

            # 4. Generate thumbnail
            thumb_path = str(out_dir / "thumbnail.jpg")
            await generate_thumbnail(
                product.name,
                product.price or 0.0,
                images[0] if images else None,
                thumb_path,
            )

            # 5. Generate YouTube SEO metadata (for YouTube/Shorts platforms)
            yt_meta: dict = {}
            description = script["sections"].get("DESCRIPTION", "")
            best_title = script["sections"].get("BEST_TITLE", product.name[:100])

            if platform in ("youtube", "youtube_shorts"):
                try:
                    yt_meta = await generate_youtube_metadata(
                        product_name=product.name,
                        price=product.price or 0.0,
                        features=features,
                        affiliate_link=affiliate_link,
                        caption=description,
                        star_rating=product.star_rating or 0.0,
                        review_count=product.review_count or 0,
                    )
                    best_title = yt_meta.get("TITLE", best_title)
                except Exception:
                    pass  # fall back to script best_title

            # 6. Persist post record
            post = await create_post(
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
            results[platform] = {
                "post_id": post.id,
                "video": video_path,
                "thumbnail": thumb_path,
                "youtube_title": best_title,
            }

            # Fire n8n webhook (non-blocking — silently skips if not configured)
            await send_to_n8n(
                post_id=post.id,
                post_type="video",
                platforms=[platform],
                caption=description,
                affiliate_link=affiliate_link,
                product_name=best_title,  # optimized SEO title instead of raw product name
                video_path=video_path,
                image_path=thumb_path,
                youtube_tags=yt_meta.get("TAGS_LIST", []),
                youtube_description=yt_meta.get("DESCRIPTION", description),
            )

        await update_job(session, job_id, status="done", result=json.dumps(results))
        return results


async def run_deal_post_campaign(
    job_id: int,
    product_id: int,
    affiliate_link: str,
    style: str = "best_deal",
    network: str = "amazon",
    price_override: float = 0.0,
) -> dict:
    """Generate deal image + post text, save post record."""
    async with AsyncSessionLocal() as session:
        await update_job(session, job_id, status="running")

        product = await get_product(session, product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found")

        images = json.loads(product.images or "[]")
        # Use manual price override if provided (Amazon blocks scraping)
        price = price_override if price_override > 0 else (product.price or 0.0)
        original_price = product.original_price if (product.original_price or 0) > price else price

        # 1. Generate post text
        post_text = await generate_deal_post(
            product_name=product.name,
            price=price,
            affiliate_link=affiliate_link,
            style=style,
            original_price=original_price if original_price > price else None,
            network=network,
        )

        # 2. Generate deal image
        out_dir = MEDIA_DIR / f"product_{product_id}" / "deal_posts"
        out_dir.mkdir(parents=True, exist_ok=True)
        image_path = str(out_dir / "deal_image.jpg")

        discount_pct = round((original_price - price) / original_price * 100, 1) if original_price > price > 0 else (product.discount_pct or 0.0)
        await create_deal_image(
            product_name=product.name,
            price=price,
            image_url=images[0] if images else None,
            network=network,
            discount_pct=discount_pct,
            output_path=image_path,
        )

        # 3. Save post record
        post = await create_post(
            session,
            product_id=product_id,
            post_type="deal_post",
            platform="facebook_group",
            post_text=post_text,
            image_path=image_path,
            affiliate_link=affiliate_link,
            affiliate_network=network,
            status="ready",
        )

        # Fire n8n webhook (non-blocking — silently skips if not configured)
        await send_to_n8n(
            post_id=post.id,
            post_type="deal_post",
            platforms=["facebook_group", "instagram"],
            caption=post_text,
            affiliate_link=affiliate_link,
            product_name=product.name,
            image_path=image_path,
        )

        result = {"post_id": post.id, "post_text": post_text, "image_path": image_path}
        await update_job(session, job_id, status="done", result=json.dumps(result))
        return result


async def run_shoe_short_campaign(
    job_id: int,
    photo_paths: list[str],
    product_name: str,
    price: float,
    affiliate_link: str,
    platforms: list[str],
    slide_duration: int = 3,
    website_url: str = "",
    howl_channel_url: str = "",
) -> dict:
    """
    Full AI Photo-to-Short pipeline:
      1. Vision AI   → analyzes shoe photos (brand, model, tech, innovation)
      2. Script AI   → generates 30-sec structured script (5 segments, timed overlays)
      3. Video AI    → FFmpeg creates video with per-segment text overlays
      4. SEO AI      → YouTube title, description, tags
      5. n8n         → publishes to YouTube Shorts / TikTok / Instagram

    Args:
        job_id:           DB job id for status tracking
        photo_paths:      absolute paths to uploaded shoe photos
        product_name:     user-provided shoe name (used as fallback if vision fails)
        price:            price in EUR
        affiliate_link:   Howl/Amazon affiliate URL
        platforms:        e.g. ["youtube_shorts", "tiktok", "instagram"]
        slide_duration:   fallback seconds per slide (simple mode only)
        website_url:      optional website for YouTube description
        howl_channel_url: optional Howl channel URL for YouTube description
    """
    async with AsyncSessionLocal() as session:
        await update_job(session, job_id, status="running")

        out_dir = Path("media") / "shoe_shorts" / f"job_{job_id}"
        out_dir.mkdir(parents=True, exist_ok=True)
        video_path = str(out_dir / "short.mp4")

        # ── Step 1: Vision AI — analyze shoe photos ──────────────────────────
        vision: dict = {}
        script: dict | None = None
        try:
            vision = await analyze_shoe_photos(photo_paths)
        except Exception as exc:
            vision = {
                "brand": product_name.split()[0] if product_name else "Sneaker",
                "model": " ".join(product_name.split()[1:]) if len(product_name.split()) > 1 else "Edition",
                "colorway": "",
                "upper_material": "mesh",
                "sole_technology": "",
                "style": "lifestyle",
                "innovation": "squeeze test semelle",
                "summary_line": product_name,
                "best_photo_index": 0,
                "hook_description": "gros plan chaussure",
            }

        # ── Step 2: Script AI — generate 30-sec structured script ────────────
        try:
            script = await generate_shoe_script(
                vision=vision,
                affiliate_link=affiliate_link,
                website_url=website_url,
                howl_channel_url=howl_channel_url,
            )
        except Exception:
            script = None  # Fall back to simple mode

        # ── Step 3: Video AI — generate Short with timed text overlays ───────
        await generate_shoe_short(
            photo_paths=photo_paths,
            output_path=video_path,
            product_name=vision.get("summary_line", product_name),
            price=price,
            slide_duration=slide_duration,
            script=script,
        )

        # ── Step 4: SEO metadata ──────────────────────────────────────────────
        brand = vision.get("brand", "")
        model = vision.get("model", "")
        seo_name = f"{brand} {model}".strip() or product_name

        yt_meta: dict = {}
        try:
            features = []
            if vision.get("upper_material"):
                features.append(f"Upper: {vision['upper_material']}")
            if vision.get("sole_technology"):
                features.append(f"Technologie: {vision['sole_technology']}")
            if vision.get("innovation"):
                features.append(vision["innovation"])

            yt_meta = await generate_youtube_metadata(
                product_name=seo_name,
                price=price,
                features=features,
                affiliate_link=affiliate_link,
                caption=script.get("youtube_description", "") if script else "",
            )
        except Exception:
            pass

        seo_title = yt_meta.get("TITLE", seo_name[:100])
        seo_description = (
            script.get("youtube_description")
            if script
            else yt_meta.get("DESCRIPTION", f"{seo_name}\n\n👟 {affiliate_link}\n\n#sneakers #shoes #ad")
        )

        # ── Step 5: Persist + publish ─────────────────────────────────────────
        results: dict[str, dict] = {}
        for platform in platforms:
            post = await create_post(
                session,
                product_id=None,
                post_type="shoe_short",
                platform=platform,
                post_text=seo_description,
                video_path=video_path,
                image_path=photo_paths[0] if photo_paths else None,
                affiliate_link=affiliate_link,
                status="ready",
            )
            results[platform] = {
                "post_id": post.id,
                "video": video_path,
                "product_line": vision.get("summary_line", product_name),
                "innovation": vision.get("innovation", ""),
                "script_segments": len(script.get("segments", [])) if script else 0,
                "canva_brief": script.get("canva_brief", "") if script else "",
                "pinned_comment": script.get("pinned_comment", affiliate_link) if script else affiliate_link,
                "youtube_description": seo_description,
            }

            await send_to_n8n(
                post_id=post.id,
                post_type="shoe_short",
                platforms=[platform],
                caption=seo_description,
                affiliate_link=affiliate_link,
                product_name=seo_title,
                video_path=video_path,
                image_path=photo_paths[0] if photo_paths else None,
                youtube_tags=yt_meta.get("TAGS_LIST", []),
                youtube_description=seo_description,
            )

        await update_job(session, job_id, status="done", result=json.dumps(results))
        return results
