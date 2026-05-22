"""
Retry & Error Recovery Utilities
================================
Exponential-backoff retry decorator and helpers for transient failures.

Use cases:
  • API calls that timeout (Groq, Meta, TikTok)
  • Network blips (httpx ReadTimeout, ConnectionError)
  • Rate limit hits (429 responses)
"""
import asyncio
import functools
import logging
import random
from typing import Any, Callable, TypeVar

import httpx

logger = logging.getLogger(__name__)

T = TypeVar("T")

RETRIABLE_EXCEPTIONS = (
    httpx.RequestError,
    httpx.TimeoutException,
    httpx.HTTPStatusError,
    asyncio.TimeoutError,
    ConnectionError,
    OSError,
)


def retry_async(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    jitter: bool = True,
    exceptions: tuple[type[Exception], ...] = RETRIABLE_EXCEPTIONS,
):
    """
    Async retry decorator with exponential backoff.

    @retry_async(max_attempts=4, base_delay=2.0)
    async def fetch_something():
        ...
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_exc: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as exc:
                    last_exc = exc
                    if attempt + 1 == max_attempts:
                        logger.warning(
                            "[retry] %s failed after %d attempts: %s",
                            func.__name__, max_attempts, exc
                        )
                        raise
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    if jitter:
                        delay = delay * (0.5 + random.random())
                    logger.info(
                        "[retry] %s attempt %d/%d failed (%s), retrying in %.1fs",
                        func.__name__, attempt + 1, max_attempts, type(exc).__name__, delay,
                    )
                    await asyncio.sleep(delay)
            if last_exc:
                raise last_exc
        return wrapper
    return decorator


async def with_timeout(coro, timeout: float, label: str = ""):
    """Run a coroutine with timeout, log on expiry."""
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        logger.warning("[timeout] %s exceeded %.1fs", label or "operation", timeout)
        raise
