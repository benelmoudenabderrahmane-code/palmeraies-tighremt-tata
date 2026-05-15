"""
Mavely has NO public API for programmatic link creation.
Links must be generated manually at https://app.mavely.com, then pasted into the dashboard.
"""
from config.settings import get_settings

settings = get_settings()


def get_mavely_link(custom_link: str | None = None) -> str | None:
    """Return the user-provided Mavely link or the global fallback from .env."""
    return custom_link or settings.mavely_default_link or None
