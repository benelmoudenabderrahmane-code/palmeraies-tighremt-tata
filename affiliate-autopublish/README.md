# Affiliate AutoPublish

Fully automated AI affiliate marketing system. Paste a product URL → scrape → AI script → video → publish to YouTube / Instagram Reels / Facebook / TikTok. Also posts AI-generated deal images to Facebook Groups automatically.

**Estimated cost: €5–15/month** (well under €50). All AI uses Claude Haiku 4.5. Voice uses gTTS (free). All platform APIs are free.

---

## Prerequisites

- Python 3.11+
- [FFmpeg](https://ffmpeg.org/download.html) installed and on PATH
- Accounts at: Amazon Associates, Anthropic, Meta (Facebook Developer), optionally YouTube / TikTok / Howl / ElevenLabs

---

## 1. Install

```bash
cd affiliate-autopublish
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
playwright install chromium
```

---

## 2. Configure API Keys

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys. At minimum you need:

| Key | Required for |
|---|---|
| `ANTHROPIC_API_KEY` | All AI text generation |
| `AMAZON_ASSOCIATE_TAG` | Amazon affiliate links |
| `META_USER_ACCESS_TOKEN` | Facebook Group + Page posts |
| `META_GROUP_ID` | Auto-posting to your group |

Everything else is optional / enhances the system.

### Getting each key

**Anthropic:** https://console.anthropic.com — Create API key (pay-per-use, Haiku is very cheap)

**Amazon Associates:** https://affiliate-program.amazon.com — Sign up, your tag looks like `yourname-20`

**Howl:** https://app.planethowl.com — Sign up as creator, go to Settings → API

**Meta (Facebook + Instagram):**
1. Create a Meta app at https://developers.facebook.com
2. Use Graph API Explorer: https://developers.facebook.com/tools/explorer/
3. Generate a User Access Token with permissions: `pages_manage_posts`, `instagram_content_publish`, `publish_to_groups`
4. Note: `publish_to_groups` requires **Meta App Review** — submit at https://developers.facebook.com/docs/apps/review

**YouTube:** Run `python auth/setup_auth.py` (interactive, opens browser OAuth flow)

**TikTok:** Create app at https://developers.tiktok.com, enable Content Posting API, use OAuth to get refresh token

**ElevenLabs (optional):** https://elevenlabs.io — Free tier = 10,000 chars/month. gTTS is used by default (free, no key needed).

**Mavely:** No API available. Generate links manually at https://app.mavely.com and paste them per-product.

---

## 3. Download Assets

**Anton font** (required for deal images):
1. Go to https://fonts.google.com/specimen/Anton
2. Download → extract `Anton-Regular.ttf`
3. Place in `assets/fonts/Anton-Regular.ttf`

**Background music** (optional, improves videos):
1. Download a free MP3 from https://pixabay.com/music/
2. Save as `assets/music/background_01.mp3`

---

## 4. Run

```bash
uvicorn main:app --reload --port 8000
```

Open **http://localhost:8000** in your browser.

---

## 5. First Campaign (end to end)

1. **Tab: New Video** → paste an Amazon product URL → click **Scrape**
2. Select **Amazon Associates** network (auto-fills your tag)
3. Check **TikTok** + **Instagram Reels**
4. Click **Generate Videos** — watch the progress bar (2–5 minutes)
5. Video files appear in `media/product_{id}/tiktok/video.mp4`
6. Publish via **Tab: Products** → click 🚀 next to the ready post, OR call
   `POST /api/post/{post_id}/publish` (form field `video_url` for Instagram)

### ⚠️ Instagram Reels & Facebook Page video uploads — public URL required

Meta's API requires a publicly accessible HTTPS URL for video upload (it does
not accept localhost files). Two options:

**Option A: ngrok (free, dev only)**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 8000
# Copy the https://xxxx.ngrok.io URL
# When publishing, pass: video_url=https://xxxx.ngrok.io/media/product_42/instagram/video.mp4
```

**Option B: Cloud storage (production)**
Upload the generated MP4 to S3/Cloudinary/Bunny, then pass the public URL.
TikTok and YouTube don't need this — they accept direct file upload.

---

## 6. Facebook Group Auto-Posting

1. **Tab: Deal Post** → paste product URL → scrape
2. Select network → choose style → click **Generate Deal Post**
3. Preview the image + text → **Post to Group Now** OR **Add to Queue**
4. **Tab: Scheduler** → set posts per day + hours → **Save**
5. The scheduler auto-picks queued posts and publishes at set hours

---

## 7. Troubleshooting

| Error | Fix |
|---|---|
| `FFmpeg not found` | Install FFmpeg and ensure it's on your PATH |
| `Amazon scrape blocked` | Amazon rate-limits scrapers. Wait 5 min and retry, or use Amazon PAAPI |
| `403 publish_to_groups` | Your Meta app needs App Review for this permission |
| `Instagram container ERROR` | Video URL must be a **public HTTPS URL** (use ngrok or cloud storage) |
| `TikTok 401` | Refresh token expired — re-run OAuth flow |
| `Pillow font error` | Download Anton-Regular.ttf to assets/fonts/ |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` inside your venv |
| `playwright._impl._errors.Error` | Run `playwright install chromium` |
| `ANTHROPIC_API_KEY not set` | Add key to .env, restart server |
| `gTTS connection error` | Check internet connection (gTTS needs network access) |
