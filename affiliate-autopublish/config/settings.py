from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # AI providers
    groq_api_key: str = ""
    gemini_api_key: str = ""
    anthropic_api_key: str = ""
    # ElevenLabs
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    # Amazon Associates
    amazon_associate_tag: str = ""
    amazon_paapi_access_key: str = ""
    amazon_paapi_secret_key: str = ""
    amazon_paapi_partner_tag: str = ""
    # Mavely (manual links only)
    mavely_default_link: str = ""
    # YouTube OAuth2
    youtube_client_id: str = ""
    youtube_client_secret: str = ""
    youtube_refresh_token: str = ""
    # Meta (Instagram + Facebook Page + Facebook Group)
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
    # Canva (optional premium deal images)
    canva_api_token: str = ""
    canva_brand_template_id: str = "DAG543g8dLc"  # Your deal post template
    # n8n publishing webhook
    n8n_webhook_url: str = ""   # e.g. http://localhost:5678/webhook/publish
    # App
    base_url: str = "http://localhost:8000"
    secret_key: str = "changeme-use-random-string-in-production"
    database_url: str = "sqlite+aiosqlite:///./affiliate.db"
    # Dashboard Basic Auth (REQUIRED — protects the dashboard + all API routes)
    dashboard_user: str = "admin"
    dashboard_password: str = ""   # If empty, app refuses to start in non-localhost mode

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
