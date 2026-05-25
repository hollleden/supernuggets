# HANDOFF — Phase B continuation: video handler

**Context:** `~/supernuggets-bot` is a Telegram bot (aiogram v3, Python) that ingests content and saves it to Supabase. Text and image handlers are complete and working. The web frontend (`~/supernuggets`) is fully built and deployed to Vercel. This session picks up with the **video handler** (Phase B item 3).

**Read first:**
- `~/supernuggets/CLAUDE.md` — full project context, stack, Supabase schema, bot output format, conventions, gotchas
- `~/supernuggets-bot/bot.py` — all existing handlers live here
- `~/supernuggets-bot/pipeline.py` — Claude tool-use pipeline (text + vision modes)
- `~/supernuggets-bot/database.py` — Supabase save/delete/quota logic

**Run the bot locally to test:** `cd ~/supernuggets-bot && .venv/bin/python bot.py`

---

## What's done

- ✅ Text handler: Telegram message → Claude Haiku (tool use) → Supabase → receipt HTML reply
- ✅ Image handler: single photo + albums, Pillow optimizer, Claude Sonnet vision
- ✅ DELETE flow, quota (5/day), typing loop, prompt caching, no-emoji aesthetic
- ✅ Web frontend deployed: https://supernuggets-a3hhdfxc8-hollledens-projects.vercel.app

---

## What to build: video handler

**User flow:** user sends a video directly in Telegram → bot downloads it → transcribes via Whisper → runs through existing text pipeline → saves with `media_type="video"` → sends receipt reply.

**Implementation plan (in order):**

### 1. Add `yt-dlp` + `openai` to dependencies
```
# requirements.txt additions
yt-dlp
openai
```
Install into venv: `cd ~/supernuggets-bot && .venv/bin/pip install yt-dlp openai`

### 2. Add Whisper transcription helper to `pipeline.py`
```python
import openai, tempfile, os

async def transcribe_video(video_bytes: bytes, mime: str = "video/mp4") -> str:
    """Send video bytes to Whisper, return transcript string."""
    client = openai.AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        f.write(video_bytes)
        tmp_path = f.name
    try:
        with open(tmp_path, "rb") as f:
            result = await client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text",
            )
        return result
    finally:
        os.unlink(tmp_path)
```
Whisper accepts mp4, mov, avi, mkv, webm — Telegram sends mp4 by default.

### 3. Add video handler to `bot.py`
Pattern mirrors the photo handler. Key differences:
- `@router.message(F.video)` or `F.video_note`
- Download via `bot.download(message.video)` → bytes
- Transcribe via `transcribe_video(video_bytes)`
- Pass transcript as `raw_content` to the existing `_save_and_reply` helper with `media_type="video"`
- If transcript is empty/failed → reply `[err] TRANSCRIPTION_FAILED — try a clearer audio track`

### 4. Add `OPENAI_API_KEY` to `.env`
The key lives in `~/supernuggets-bot/.env`. Add it if not already there:
```
OPENAI_API_KEY=sk-...
```
Use `setup_env.sh` or `nano .env` — never TextEdit (iCloud autosave issue).

### 5. Test
- Send a short video (< 60s) to `@supernuggets_bot`
- Confirm receipt appears in Telegram + entry appears on the live web frontend
- Check Supabase `entries` table: `media_type` should be `"video"`, `raw_content` should be the transcript

---

## Env vars in `.env`

| Key | Notes |
|---|---|
| `BOT_TOKEN` | `@supernuggets_bot` token — starts with a number, not the old dead one |
| `ADMIN_ID` | `445276` |
| `SUPABASE_URL` | `https://yncxcnfgiwdfnxkigodo.supabase.co` |
| `SUPABASE_SECRET_KEY` | starts with `sb_secret_MnzWU...` |
| `ANTHROPIC_API_KEY` | for Claude Haiku/Sonnet pipeline |
| `OPENAI_API_KEY` | needed for Whisper — ADD THIS if not present |

---

## Gotchas for video handler

- **Telegram video size limit**: bots can download files up to 20MB (bot API) or 2GB (local API). Most personal videos are fine. If too large, reply `[limit] VIDEO_TOO_LARGE — max 20MB via Telegram`.
- **Whisper input limit**: 25MB audio. For large videos, extract audio first (ffmpeg) or truncate. For now, just pass mp4 directly — Whisper handles it.
- **Transcription cost**: Whisper is $0.006/min. A 3-min video = $0.018. Fine for personal use.
- **`video_note`** = Telegram's circular "video message" format. Treat it the same as `video` — same download + transcribe flow.
- **Empty transcript**: Whisper returns `""` for silent/music-only videos. Handle gracefully.
- **`load_dotenv()` order**: must be called BEFORE importing `pipeline` or `database` — they read env at import time. Already handled in `bot.py` if following existing pattern.

---

## After video handler: what's next

Per CLAUDE.md Phase B:
4. **URL handler** — user sends a TikTok/Instagram/YouTube URL → `yt-dlp` downloads → branch to video or image handler
5. **Menus** — `/recent`, `/today`, `/folder <name>` inline keyboards
6. **Scheduler** — weekly digest via APScheduler
7. **Deploy bot to Railway**

User profile: non-technical. Explain steps before running. Confirm before destructive actions.
