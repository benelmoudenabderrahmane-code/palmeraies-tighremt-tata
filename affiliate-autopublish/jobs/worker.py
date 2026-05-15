import json
from pathlib import Path

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

            # 5. Persist post record
            description = script["sections"].get("DESCRIPTION", "")
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
            }

        await update_job(session, job_id, status="done", result=json.dumps(results))
        return results


async def run_deal_post_campaign(
    job_id: int,
    product_id: int,
    affiliate_link: str,
    style: str = "best_deal",
    network: str = "amazon",
) -> dict:
    """Generate deal image + post text, save post record."""
    async with AsyncSessionLocal() as session:
        await update_job(session, job_id, status="running")

        product = await get_product(session, product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found")

        images = json.loads(product.images or "[]")

        # 1. Generate post text
        post_text = await generate_deal_post(
            product_name=product.name,
            price=product.price or 0.0,
            affiliate_link=affiliate_link,
            style=style,
            original_price=product.original_price,
            network=network,
        )

        # 2. Generate deal image
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

        result = {"post_id": post.id, "post_text": post_text, "image_path": image_path}
        await update_job(session, job_id, status="done", result=json.dumps(result))
        return result
