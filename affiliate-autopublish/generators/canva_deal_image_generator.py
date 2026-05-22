"""
Canva-powered deal image generator.

Uses the Canva Connect REST API to autofill your branded template with
per-deal data (network label, price, product photo) and export a JPG.

Prerequisites:
  1. Add CANVA_API_TOKEN to .env  (see auth/canva_setup.py)
  2. CANVA_BRAND_TEMPLATE_ID is already set to your template (DAG543g8dLc)

Falls back silently to the Pillow generator if the token is missing or
if any API call fails.
"""

import asyncio
import logging
from pathlib import Path

import httpx

from config.settings import get_settings

logger = logging.getLogger(__name__)

_BASE = "https://api.canva.com/rest/v1"
_NETWORK_LABELS = {
    "howl":    "Howl  Deal",
    "amazon":  "Amazon  Deal",
    "mavely":  "Mavely  Deal",
}


def _client() -> httpx.AsyncClient:
    # Call get_settings() inside the factory so hot-reloaded tokens are always used
    token = get_settings().canva_api_token
    return httpx.AsyncClient(
        base_url=_BASE,
        headers={"Authorization": f"Bearer {token}"},
        verify=False,
        timeout=90.0,
    )


async def _upload_image(client: httpx.AsyncClient, image_url: str) -> str | None:
    """Upload a remote image URL to Canva and return asset_id."""
    try:
        r = await client.post("/asset-uploads", json={"name": "product", "url": image_url})
        if r.status_code not in (200, 202):
            logger.warning("Canva asset upload HTTP %s: %s", r.status_code, r.text[:200])
            return None
        job_id = r.json()["job"]["id"]
        for _ in range(25):
            await asyncio.sleep(2)
            sr = await client.get(f"/asset-uploads/{job_id}")
            jd = sr.json().get("job", {})
            if jd.get("status") == "success":
                return jd["asset"]["id"]
            if jd.get("status") == "failed":
                logger.warning("Canva asset upload failed: %s", jd)
                return None
        logger.warning("Canva asset upload timed out")
    except Exception as exc:
        logger.warning("Canva asset upload error: %s", exc)
    return None


async def _autofill(client: httpx.AsyncClient, data: dict, title: str) -> str | None:
    """Create an autofill job from the brand template and return the new design_id."""
    try:
        r = await client.post("/autofills", json={
            "brand_template_id": get_settings().canva_brand_template_id,
            "title": title,
            "data": data,
        })
        if r.status_code not in (200, 202):
            logger.warning("Canva autofill HTTP %s: %s", r.status_code, r.text[:300])
            return None
        job_id = r.json()["job"]["id"]
        for _ in range(30):
            await asyncio.sleep(2)
            sr = await client.get(f"/autofills/{job_id}")
            jd = sr.json().get("job", {})
            if jd.get("status") == "success":
                return jd["design"]["id"]
            if jd.get("status") == "failed":
                logger.warning("Canva autofill job failed: %s", jd)
                return None
        logger.warning("Canva autofill timed out")
    except Exception as exc:
        logger.warning("Canva autofill error: %s", exc)
    return None


async def _export_jpg(client: httpx.AsyncClient, design_id: str) -> str | None:
    """Export design page 1 as JPG and return the download URL."""
    try:
        r = await client.post("/exports", json={
            "design_id": design_id,
            "format": {"type": "jpg", "export_quality": "pro", "pages": [1]},
        })
        if r.status_code not in (200, 202):
            logger.warning("Canva export HTTP %s: %s", r.status_code, r.text[:200])
            return None
        job_id = r.json()["job"]["id"]
        for _ in range(30):
            await asyncio.sleep(2)
            sr = await client.get(f"/exports/{job_id}")
            jd = sr.json().get("job", {})
            if jd.get("status") == "success":
                return jd["urls"][0]
            if jd.get("status") == "failed":
                logger.warning("Canva export failed: %s", jd)
                return None
        logger.warning("Canva export timed out")
    except Exception as exc:
        logger.warning("Canva export error: %s", exc)
    return None


async def create_canva_deal_image(
    product_name: str,
    price: float,
    image_url: str | None,
    network: str,
    output_path: str,
) -> bool:
    """
    Generate a deal image from your Canva template.

    Returns True and saves JPG to output_path on success.
    Returns False if Canva is not configured or any step fails
    (caller should fall back to the Pillow generator).
    """
    if not get_settings().canva_api_token:
        return False

    label = _NETWORK_LABELS.get(network, f"{network.title()}  Deal")
    price_text = f"Now ${price:.2f}"
    title = f"Deal – {product_name[:60]}"

    try:
        async with _client() as c:
            # 1. Upload product image (best-effort)
            asset_id: str | None = None
            if image_url:
                asset_id = await _upload_image(c, image_url)

            # 2. Build autofill data
            data: dict = {
                "network_label": {"type": "text", "text": label},
                "price_text":    {"type": "text", "text": price_text},
            }
            if asset_id:
                data["product_image"] = {"type": "image", "asset_id": asset_id}

            # 3. Autofill template → new design
            design_id = await _autofill(c, data, title)
            if not design_id:
                return False

            # 4. Export as JPG
            download_url = await _export_jpg(c, design_id)
            if not download_url:
                return False

            # 5. Download and save
            async with httpx.AsyncClient(verify=False, timeout=60) as dl:
                resp = await dl.get(download_url)
                resp.raise_for_status()
                Path(output_path).parent.mkdir(parents=True, exist_ok=True)
                Path(output_path).write_bytes(resp.content)

        logger.info("Canva deal image saved to %s", output_path)
        return True

    except Exception as exc:
        logger.warning("Canva deal image generation failed (%s), falling back to Pillow", exc)
        return False
