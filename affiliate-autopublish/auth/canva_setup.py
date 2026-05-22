"""
One-time Canva API token setup.

Run:  python auth/canva_setup.py

This opens your browser to authorize the app, waits for the callback,
then writes CANVA_API_TOKEN to .env automatically.

Requirements before running:
  1. Go to https://www.canva.com/developers/
  2. Create an integration (choose "Connect API")
  3. Set Redirect URI to: http://localhost:9999/callback
  4. Copy the Client ID and Client Secret into the prompts below
     (or pre-set CANVA_CLIENT_ID / CANVA_CLIENT_SECRET in .env)
"""

import asyncio
import base64
import hashlib
import os
import secrets
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import httpx

ENV_FILE = Path(__file__).parent.parent / ".env"
REDIRECT_URI = "http://localhost:9999/callback"
SCOPES = "design:content:read design:content:write asset:read asset:write"

_callback_code: str | None = None


class _Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        global _callback_code
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        _callback_code = params.get("code", [None])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"<h2>Authorization complete. You can close this tab.</h2>")

    def log_message(self, *_):
        pass


def _pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge


def _update_env(key: str, value: str) -> None:
    lines = ENV_FILE.read_text(encoding="utf-8").splitlines() if ENV_FILE.exists() else []
    found = False
    new_lines = []
    for line in lines:
        if line.startswith(f"{key}="):
            new_lines.append(f"{key}={value}")
            found = True
        else:
            new_lines.append(line)
    if not found:
        new_lines.append(f"{key}={value}")
    ENV_FILE.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


async def main():
    client_id = os.environ.get("CANVA_CLIENT_ID") or input("Canva Client ID: ").strip()
    client_secret = os.environ.get("CANVA_CLIENT_SECRET") or input("Canva Client Secret: ").strip()

    verifier, challenge = _pkce_pair()
    state = secrets.token_urlsafe(16)

    auth_url = (
        "https://www.canva.com/api/oauth/authorize?"
        + urllib.parse.urlencode({
            "client_id": client_id,
            "response_type": "code",
            "redirect_uri": REDIRECT_URI,
            "scope": SCOPES,
            "state": state,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        })
    )

    print(f"\nOpening browser for Canva authorization…\n{auth_url}\n")
    webbrowser.open(auth_url)

    server = HTTPServer(("localhost", 9999), _Handler)
    print("Waiting for callback on http://localhost:9999/callback …")
    server.handle_request()  # blocks until one request

    if not _callback_code:
        print("No code received. Aborted.")
        return

    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.post(
            "https://api.canva.com/rest/v1/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": _callback_code,
                "redirect_uri": REDIRECT_URI,
                "code_verifier": verifier,
                "client_id": client_id,
                "client_secret": client_secret,
            },
        )
        resp.raise_for_status()
        token_data = resp.json()

    access_token = token_data.get("access_token", "")
    refresh_token = token_data.get("refresh_token", "")

    _update_env("CANVA_API_TOKEN", access_token)
    if refresh_token:
        _update_env("CANVA_REFRESH_TOKEN", refresh_token)

    print(f"\n✅  CANVA_API_TOKEN saved to .env")
    if refresh_token:
        print(f"✅  CANVA_REFRESH_TOKEN saved (use to refresh without re-auth)")
    print("\nRestart the server: uvicorn main:app --reload")


if __name__ == "__main__":
    asyncio.run(main())
