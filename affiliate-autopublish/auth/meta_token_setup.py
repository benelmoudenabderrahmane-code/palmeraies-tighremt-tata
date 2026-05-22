#!/usr/bin/env python3
"""
Meta Token Setup — Affiliate AutoPublish
=========================================
1. Takes your short-lived User Access Token (1 hour)
2. Exchanges it for a long-lived token (60 days)
3. Fetches your Page ID, Instagram Account ID, and Group ID
4. Prints the exact lines to paste into .env

Usage:
    python auth/meta_token_setup.py

Requirements: META_APP_ID and META_APP_SECRET must be in .env first.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import httpx

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

BASE = "https://graph.facebook.com/v19.0"


def banner():
    print(f"\n{BOLD}╔══════════════════════════════════════════════════════╗")
    print(f"║  Meta Token Setup — Affiliate AutoPublish            ║")
    print(f"╚══════════════════════════════════════════════════════╝{RESET}\n")


def get_env():
    """Load APP_ID and APP_SECRET from .env (dotenv-free)."""
    env = {}
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    env[k.strip()] = v.strip()
    return env


def exchange_long_lived(app_id: str, app_secret: str, short_token: str) -> str:
    """Exchange a short-lived token for a 60-day long-lived token."""
    print(f"{CYAN}  → Exchanging for long-lived token (60 days)…{RESET}")
    r = httpx.get(
        f"{BASE}/oauth/access_token",
        params={
            "grant_type": "fb_exchange_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "fb_exchange_token": short_token,
        },
        verify=False,
    )
    data = r.json()
    if "access_token" not in data:
        print(f"{RED}  ✗ Exchange failed: {data}{RESET}")
        sys.exit(1)
    expires = data.get("expires_in", "unknown")
    print(f"{GREEN}  ✓ Long-lived token obtained (expires in ~{int(expires)//86400} days){RESET}")
    return data["access_token"]


def check_permissions(token: str) -> list[str]:
    """Return list of granted permissions."""
    r = httpx.get(f"{BASE}/me/permissions", params={"access_token": token}, verify=False)
    data = r.json()
    granted = [
        p["permission"]
        for p in data.get("data", [])
        if p.get("status") == "granted"
    ]
    return granted


def get_user_info(token: str) -> dict:
    r = httpx.get(f"{BASE}/me", params={"fields": "id,name", "access_token": token}, verify=False)
    return r.json()


def get_pages(token: str) -> list[dict]:
    r = httpx.get(f"{BASE}/me/accounts", params={"access_token": token}, verify=False)
    return r.json().get("data", [])


def get_instagram_account(page_id: str, page_token: str) -> str | None:
    r = httpx.get(
        f"{BASE}/{page_id}",
        params={"fields": "instagram_business_account", "access_token": page_token},
        verify=False,
    )
    data = r.json()
    return data.get("instagram_business_account", {}).get("id")


def get_groups(token: str) -> list[dict]:
    r = httpx.get(
        f"{BASE}/me/groups",
        params={"fields": "id,name,privacy", "access_token": token},
        verify=False,
    )
    return r.json().get("data", [])


def pick(items: list[dict], label: str) -> dict | None:
    if not items:
        return None
    if len(items) == 1:
        print(f"  Auto-selected: {BOLD}{items[0].get('name', items[0]['id'])}{RESET}")
        return items[0]
    print(f"\n  Select your {label}:")
    for i, item in enumerate(items):
        priv = f" [{item.get('privacy', '')}]" if "privacy" in item else ""
        print(f"    {i + 1}. {item.get('name', item['id'])}{priv}  (ID: {item['id']})")
    while True:
        try:
            choice = int(input(f"  Enter number (1-{len(items)}): ").strip())
            if 1 <= choice <= len(items):
                return items[choice - 1]
        except (ValueError, KeyboardInterrupt):
            pass


def update_env(updates: dict[str, str]):
    """Write key=value pairs into .env, replacing existing lines."""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    with open(env_path) as f:
        lines = f.readlines()

    for key, value in updates.items():
        replaced = False
        for i, line in enumerate(lines):
            if line.strip().startswith(f"{key}=") or line.strip() == key:
                lines[i] = f"{key}={value}\n"
                replaced = True
                break
        if not replaced:
            lines.append(f"{key}={value}\n")

    with open(env_path, "w") as f:
        f.writelines(lines)


# ─────────────────────────────────────────────────────────────────────────────

def main():
    banner()
    env = get_env()

    app_id     = env.get("META_APP_ID", "").strip()
    app_secret = env.get("META_APP_SECRET", "").strip()

    # ── Step 1: App credentials ───────────────────────────────────────────────
    print(f"{BOLD}STEP 1 — App credentials{RESET}")
    if not app_id:
        print("  META_APP_ID not found in .env")
        app_id = input("  Paste your App ID: ").strip()
    else:
        print(f"  META_APP_ID     : {GREEN}{app_id}{RESET}")

    if not app_secret:
        print("  META_APP_SECRET not found in .env")
        app_secret = input("  Paste your App Secret: ").strip()
    else:
        print(f"  META_APP_SECRET : {GREEN}{'*' * len(app_secret)}{RESET}")

    if not app_id or not app_secret:
        print(f"{RED}✗ App ID and Secret are required.{RESET}")
        print("\nGet them from: https://developers.facebook.com → Your App → Settings → Basic\n")
        sys.exit(1)

    # ── Step 2: Short-lived token ─────────────────────────────────────────────
    print(f"\n{BOLD}STEP 2 — Short-lived User Access Token{RESET}")
    print("  1. Open: https://developers.facebook.com/tools/explorer/")
    print(f"  2. Select your app ({app_id})")
    print("  3. Click 'Generate Access Token'")
    print("  4. Add these permissions:")
    print("       ✓ pages_manage_posts")
    print("       ✓ pages_read_engagement")
    print("       ✓ instagram_basic")
    print("       ✓ instagram_content_publish")
    print("       ✓ publish_to_groups")
    print("       ✓ groups_access_member_info")
    print("  5. Copy the token (starts with EAA…)\n")
    short_token = input("  Paste token: ").strip()
    if not short_token:
        print(f"{RED}✗ Token required.{RESET}")
        sys.exit(1)

    # ── Step 3: Exchange ──────────────────────────────────────────────────────
    print(f"\n{BOLD}STEP 3 — Token exchange{RESET}")
    long_token = exchange_long_lived(app_id, app_secret, short_token)

    # ── Step 4: Permissions check ─────────────────────────────────────────────
    print(f"\n{BOLD}STEP 4 — Permissions{RESET}")
    perms = check_permissions(long_token)
    want  = ["pages_manage_posts", "instagram_content_publish", "publish_to_groups"]
    for p in want:
        icon = f"{GREEN}✓{RESET}" if p in perms else f"{YELLOW}✗{RESET}"
        print(f"  {icon} {p}")
    if "publish_to_groups" not in perms:
        print(f"\n  {YELLOW}⚠  publish_to_groups not granted.")
        print(f"  This is normal — the permission requires App Review for production.")
        print(f"  Your app can still post to groups you ADMIN in development mode.{RESET}")

    # ── Step 5: User info ─────────────────────────────────────────────────────
    print(f"\n{BOLD}STEP 5 — Account info{RESET}")
    user = get_user_info(long_token)
    print(f"  Logged in as: {BOLD}{user.get('name', '?')}{RESET} (ID: {user.get('id', '?')})")

    # ── Step 6: Pages ─────────────────────────────────────────────────────────
    print(f"\n{BOLD}STEP 6 — Facebook Page{RESET}")
    pages = get_pages(long_token)
    page_id = ""
    page_token = long_token
    ig_id = ""

    if not pages:
        print(f"  {YELLOW}No pages found. META_PAGE_ID will be left empty.{RESET}")
    else:
        page = pick(pages, "Facebook Page")
        if page:
            page_id    = page["id"]
            page_token = page.get("access_token", long_token)
            print(f"  {GREEN}✓ Page ID: {page_id}{RESET}")

            # Instagram linked to that page
            ig_id = get_instagram_account(page_id, page_token) or ""
            if ig_id:
                print(f"  {GREEN}✓ Instagram Account ID: {ig_id}{RESET}")
            else:
                print(f"  {YELLOW}  No Instagram Business Account linked to this page.{RESET}")

    # ── Step 7: Groups ────────────────────────────────────────────────────────
    print(f"\n{BOLD}STEP 7 — Facebook Group{RESET}")
    groups = get_groups(long_token)
    group_id = ""

    if not groups:
        print(f"  {YELLOW}No groups found via API. You may need to add your Group to the app.{RESET}")
        print("  Go to: https://developers.facebook.com → Your App → Add Product → Groups API")
        print("  Then: Settings → Advanced → Group IDs → Add your group\n")
        group_id = input("  Paste your Group ID manually (or press Enter to skip): ").strip()
    else:
        group = pick(groups, "Facebook Group")
        if group:
            group_id = group["id"]
            print(f"  {GREEN}✓ Group ID: {group_id}{RESET}")

    # ── Step 8: Write .env ────────────────────────────────────────────────────
    print(f"\n{BOLD}STEP 8 — Saving to .env{RESET}")
    updates = {
        "META_APP_ID":                 app_id,
        "META_APP_SECRET":             app_secret,
        "META_USER_ACCESS_TOKEN":      long_token,
    }
    if page_id:    updates["META_PAGE_ID"] = page_id
    if ig_id:      updates["META_INSTAGRAM_ACCOUNT_ID"] = ig_id
    if group_id:   updates["META_GROUP_ID"] = group_id

    update_env(updates)

    print(f"\n{GREEN}{BOLD}✅ .env updated with:{RESET}")
    for k, v in updates.items():
        display = ('*' * min(len(v), 12) + '…') if "TOKEN" in k or "SECRET" in k else v
        print(f"   {k}={display}")

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{BOLD}{'─'*56}{RESET}")
    print(f"{GREEN}{BOLD}  🎉 Setup complete!{RESET}")
    print(f"  Your long-lived token expires in ~60 days.")
    print(f"  To refresh it: python auth/meta_token_setup.py")
    print(f"{'─'*56}\n")


if __name__ == "__main__":
    main()
