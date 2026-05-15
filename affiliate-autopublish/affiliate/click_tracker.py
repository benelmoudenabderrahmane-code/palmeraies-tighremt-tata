import hashlib
from fastapi import Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from database.crud import get_link_by_redirect_id, log_click


def _detect_platform(referrer: str) -> str:
    referrer_lower = referrer.lower()
    for platform in ("youtube", "instagram", "facebook", "tiktok"):
        if platform in referrer_lower:
            return platform
    return "unknown"


async def handle_redirect(rid: str, request: Request, session: AsyncSession) -> Response:
    link = await get_link_by_redirect_id(session, rid)
    if not link:
        return Response("Link not found", status_code=404)

    referrer = request.headers.get("referer", "direct")
    platform = _detect_platform(referrer)
    ua = request.headers.get("user-agent", "")[:500]
    client_ip = request.client.host if request.client else "0.0.0.0"
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:16]

    await log_click(session, link.id, referrer, platform, ua, ip_hash)
    return RedirectResponse(url=link.affiliate_link, status_code=302)
