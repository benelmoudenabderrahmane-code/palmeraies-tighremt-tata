#!/usr/bin/env python3
"""
One-time OAuth2 setup for YouTube, Meta, and TikTok.
Run: python auth/setup_auth.py
Copy the tokens it prints into your .env file.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import httpx
from config.settings import get_settings

settings = get_settings()


def setup_youtube():
    if not settings.youtube_client_id or not settings.youtube_client_secret:
        print("⚠️  YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET not set — skipping YouTube.\n")
        return

    auth_url = (
        "https://accounts.google.com/o/oauth2/auth"
        f"?client_id={settings.youtube_client_id}"
        "&redirect_uri=urn:ietf:wg:oauth:2.0:oob"
        "&scope=https://www.googleapis.com/auth/youtube.upload"
        "&response_type=code"
        "&access_type=offline"
        "&prompt=consent"
    )
    print("─── YouTube OAuth2 ───────────────────────────────────────")
    print(f"1. Open this URL in your browser:\n\n   {auth_url}\n")
    code = input("2. Paste the authorization code here: ").strip()
    if not code:
        print("Skipped.\n")
        return

    resp = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": settings.youtube_client_id,
            "client_secret": settings.youtube_client_secret,
            "redirect_uri": "urn:ietf:wg:oauth:2.0:oob",
            "grant_type": "authorization_code",
        },
    )
    data = resp.json()
    if "refresh_token" in data:
        print(f"\n✅ Add to .env:\n   YOUTUBE_REFRESH_TOKEN={data['refresh_token']}\n")
    else:
        print(f"❌ Error: {data}\n")


def setup_meta():
    if not settings.meta_app_id:
        print("⚠️  META_APP_ID not set — skipping Meta.\n")
        return

    print("─── Meta (Facebook + Instagram) ─────────────────────────")
    print("1. Go to the Facebook Graph API Explorer:")
    print("   https://developers.facebook.com/tools/explorer/\n")
    print("2. Select your app from the dropdown")
    print("3. Click 'Generate Access Token'")
    print("4. Add permissions:")
    print("   • pages_manage_posts")
    print("   • pages_read_engagement")
    print("   • instagram_basic")
    print("   • instagram_content_publish")
    print("   • publish_to_groups  (requires App Review)")
    print("   • groups_access_member_info  (requires App Review)")
    print("5. Copy the token\n")
    token = input("Paste your User Access Token: ").strip()
    if token:
        print(f"\n✅ Add to .env:\n   META_USER_ACCESS_TOKEN={token}")
        print("\nAlso find and set:")
        print("   META_PAGE_ID         — your Facebook Page numeric ID")
        print("   META_INSTAGRAM_ACCOUNT_ID — your Instagram Business Account ID")
        print("   META_GROUP_ID        — your Facebook Group numeric ID\n")
    else:
        print("Skipped.\n")


def setup_tiktok():
    if not settings.tiktok_client_key or not settings.tiktok_client_secret:
        print("⚠️  TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET not set — skipping TikTok.\n")
        return

    print("─── TikTok Content Posting API ───────────────────────────")
    print("1. Go to your TikTok Developer app dashboard:")
    print("   https://developers.tiktok.com/apps/\n")
    print("2. Enable 'Content Posting API' in your app")
    print("3. Use the OAuth flow to get a refresh_token")
    print("   (Sandbox: use sandbox.tiktokapis.com)\n")
    token = input("Paste your TikTok Refresh Token: ").strip()
    if token:
        print(f"\n✅ Add to .env:\n   TIKTOK_REFRESH_TOKEN={token}\n")
    else:
        print("Skipped.\n")


if __name__ == "__main__":
    print("\n╔══════════════════════════════════════════════════╗")
    print("║   Affiliate AutoPublish — Auth Setup             ║")
    print("╚══════════════════════════════════════════════════╝\n")
    setup_youtube()
    setup_meta()
    setup_tiktok()
    print("─────────────────────────────────────────────────────")
    print("✅ Done. Update your .env file with the tokens above.")
    print("   Then run: uvicorn main:app --reload --port 8000\n")
