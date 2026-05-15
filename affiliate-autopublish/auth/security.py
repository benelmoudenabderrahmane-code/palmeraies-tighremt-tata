"""
Basic Auth + simple in-memory rate limiter.
Protects the dashboard + all /api/* routes. The /go/{id} click tracker is
rate-limited but does NOT require auth (so affiliate links keep working).
"""
import secrets
import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from config.settings import get_settings

settings = get_settings()
_basic = HTTPBasic(auto_error=False)


def require_auth(credentials: HTTPBasicCredentials | None = Depends(_basic)) -> str:
    """Dependency: enforces Basic Auth on protected routes."""
    if not settings.dashboard_password:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "DASHBOARD_PASSWORD not set in .env — refusing to start unprotected.",
        )
    if credentials is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Authentication required",
            headers={"WWW-Authenticate": "Basic"},
        )
    # Constant-time comparison to prevent timing attacks
    user_ok = secrets.compare_digest(credentials.username, settings.dashboard_user)
    pass_ok = secrets.compare_digest(credentials.password, settings.dashboard_password)
    if not (user_ok and pass_ok):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


# ── Simple sliding-window rate limiter for /go/{id} ─────────────────────────────
_RATE_WINDOW_SEC = 60
_RATE_MAX_HITS = 30  # 30 clicks per IP per minute is plenty for affiliate links
_hits: dict[str, deque] = defaultdict(deque)


def rate_limit_redirect(request: Request) -> None:
    """Block obvious spam on /go/{id}. Per-IP sliding 60s window."""
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = _hits[ip]
    # Drop entries older than the window
    while window and window[0] < now - _RATE_WINDOW_SEC:
        window.popleft()
    if len(window) >= _RATE_MAX_HITS:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many requests")
    window.append(now)
