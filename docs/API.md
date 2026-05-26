# supernuggets — API Reference

Internal module/function reference + Supabase schema. This is the contract layer between the bot, the database, and the frontend.

---

## 1. Supabase schema

### Table: `entries`
Verified live as of 2026-05-26.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `bigserial` | no | PK, auto-increment |
| `user_id` | `bigint` | no | Telegram user_id of the saver |
| `created_at` | `date` | no | UTC date (not timestamp) — quota resets at 00:00 UTC |
| `media_type` | `text` | no | one of: `text`, `image`, `image_group`, `video`, `video_url`, `image_url`, `article`, `manual` |
| `raw_content` | `text` | yes | The user's original input — text body, OCR+caption for images, Whisper transcript for video, article body. NOT the bot's formatted output. |
| `summary` | `text` | yes | `JSON.stringify(["bullet 1", "bullet 2", ...])` — 2-3 bullets |
| `tags` | `text` | yes | `JSON.stringify(["tag_1", "tag_2", ...])` — 3-5 underscore-lowercase tags |
| `folder` | `text` | yes | one of the 12 folders (free string; bot enforces enum) |
| `fact_check` | `text` | yes | `JSON.stringify([{claim, evidence, search_query}, ...])` |
| `enrichment` | `text` | yes | `JSON.stringify({mentioned: [...], source_url?, source_platform?, source_uploader?, source_duration_s?, source_kind?})` |
| `title` | `text` | yes | UPPERCASE, no decorative subtitle, max 60 chars |
| `formatted_output` | `text` | yes | Pre-rendered receipt HTML (Telegram-safe) |
| `content_type` | `text` | yes | reserved (currently unused) |
| `message_id` | `bigint` | yes | original Telegram message_id of the user's input |

**No `tg_message_link` column** — was referenced by old listo-bot code but doesn't exist in the live schema.

**RLS status:** disabled (single-user vault). Will be enabled in Phase C with magic-URL auth.

### Table: `users` (Phase C — not in use yet)
Reserved for the magic-URL feature. Shape will be:
```
id          bigserial PK
telegram_id bigint UNIQUE
token       text UNIQUE (secrets.token_urlsafe(32))
created_at  timestamptz default now()
```

### `enrichment` JSON shape (current)
```jsonc
{
  "mentioned": [
    { "name": "Cicaplast Baume B5+", "search_query": "La Roche-Posay Cicaplast Baume B5+" },
    { "name": "VT Reedle Shot 300", "search_query": "VT Cosmetics Reedle Shot 300" }
  ],
  // present only for URL-derived entries:
  "source_url": "https://www.tiktok.com/@insiderforce/video/7638650613064027399",
  "source_platform": "TikTok",
  "source_uploader": "insiderforce",
  "source_duration_s": 79,
  "source_kind": "video"
}
```

---

## 2. Bot Python modules

### `bot.py` — Telegram entry point

#### Constants
- `BOT_TOKEN` — env `BOT_TOKEN`; bot dies on startup if missing
- `WEB_URL` — env `WEB_URL`, defaults to `http://localhost:3000`; `https://` required to render the OPEN button
- `ADMIN_ID` — env `ADMIN_ID` (int); admin bypasses daily quota
- `DAILY_LIMIT = 5` — entries/day for non-admin users
- `TG_VIDEO_MAX_BYTES = 20 * 1024 * 1024` — Telegram bot API getFile cap

#### Handlers
| Handler | Filter | What it does |
|---|---|---|
| `on_start` | `CommandStart()` | Sends help/limits message |
| `on_text` | `F.text & ~F.text.startswith("/")` | URL routing → `_handle_url`; else text pipeline |
| `on_photo` | `F.photo` | Single photo → process; album → buffer + debounce |
| `on_video` | `F.video \| F.video_note` | Video → Whisper → text pipeline (with caption) |
| `on_delete_confirm` | `F.data.startswith("del:")` | Swap to confirm-delete keyboard |
| `on_delete_cancel` | `F.data.startswith("delno:")` | Restore original keyboard |
| `on_delete_yes` | `F.data.startswith("delyes:")` | Execute delete |
| `on_unsupported` | `dp.message()` (catch-all) | Reply `[unsupported]` for unhandled media types |

#### Helpers
| Function | Signature | Purpose |
|---|---|---|
| `entry_keyboard(entry_id, source_url=None)` | → `InlineKeyboardMarkup` | Builds `[⬈ OPEN][↗ SOURCE][⌫ DELETE]`; SOURCE only when source_url present and `https://` |
| `confirm_delete_keyboard(entry_id)` | → `InlineKeyboardMarkup` | `[✓ YES DELETE][✗ CANCEL]` |
| `_typing_loop(chat_id, stop)` | async | Re-sends typing action every 4s until `stop.set()` |
| `_check_quota(user_id)` | → `(allowed, count)` | Returns admin=unlimited; counts today's UTC rows |
| `_check_quota_and_reject(message, user_id)` | async → `bool` | Quota check + auto-reply on rejection |
| `_save_and_reply(*, reply_target, user_id, media_type, raw_content, parsed, formatted, message_id, source=None)` | async | Inserts row, sends receipt with buttons |
| `_handle_url(message, *, user_id, url, caption)` | async | URL dispatch: yt-dlp media → article fallback |
| `_ingest_url_video(message, user_id, info, source, caption)` | async | yt-dlp video download → Whisper → text pipeline |
| `_ingest_url_images(message, user_id, info, source, caption)` | async | yt-dlp images download → vision pipeline |
| `_download_photo_bytes(message)` | async → `(bytes, mime)` | Downloads largest photo size, sniffs MIME |
| `_handle_photo_batch(messages)` | async | Processes single photo OR debounced album |
| `_flush_album(media_group_id)` | async | Fires after 1.5s debounce |
| `_sniff_mime(data)` | → `str` | Identifies JPEG/PNG/GIF/WebP/HEIC from magic bytes |
| `_err(line)` | → `str` | Appends `ping @holeden` footer |
| `_time_until_utc_midnight()` | → `str` | e.g. `"6h 23m"` for the quota-reset countdown |

### `pipeline.py` — AI + media + URL extraction

#### Constants
- `MODEL_TEXT = "claude-haiku-4-5-20251001"` (env override: `CLAUDE_MODEL_TEXT`)
- `MODEL_VISION = "claude-haiku-4-5-20251001"` (env override: `CLAUDE_MODEL_VISION` — set to `claude-sonnet-4-6` to revert to the bigger model if vision quality regresses)
- `MAX_TOKENS = 1200` — Claude output cap per call
- `TG_MAX_LEN = 4000` — Telegram receipt length budget (reserves 96 from the 4096 limit)
- `MAX_IMAGE_DIM = 1568` — Anthropic recommended max
- `JPEG_QUALITY = 85`
- `FOLDERS` — list of 12 folder names
- `URL_RE` — `re.compile(r"https?://[^\s<>\"]+", re.IGNORECASE)`
- `URL_DURATION_CAPS` — dict, see [ARCHITECTURE.md §5.2](ARCHITECTURE.md#52-duration-caps-rationale)

#### Core functions

| Function | Purpose |
|---|---|
| `process_text(user_text, source=None)` → `(parsed, formatted)` | Run text mode; optional source appends SOURCE footer to receipt |
| `process_images(images, caption="", source=None)` → `(parsed, formatted, raw_content)` | Run vision mode; `images: list[(bytes, mime)]` |
| `transcribe_video(video_bytes, suffix=".mp4")` → `str` | Whisper API call; returns "" for silent clips |
| `render(parsed, raw_content, source=None)` → `str` | Build the receipt HTML; budget-aware transcript truncation |
| `find_first_url(text)` → `str \| None` | Regex-find first `https?://...` |
| `extract_url_info(url)` → `dict` | yt-dlp inspect (no download); raises `URLRejected` / `URLUnsupported` |
| `url_info_kind(info)` → `"video" \| "images"` | Classify yt-dlp output |
| `download_url_video(info)` → `bytes` | Download best mp4 ≤ 25MB |
| `download_url_images(info, max_images=10)` → `list[(bytes, mime)]` | Fetch carousel images |
| `extract_article(url)` → `dict` | trafilatura main-text extraction; raises if body < 80 chars |
| `build_video_url_input(info, transcript, caption="")` → `str` | Compose AI input: SOURCE + TITLE + DESCRIPTION + USER NOTE + TRANSCRIPT |
| `build_article_input(article, caption="")` → `str` | Compose AI input: SOURCE + TITLE + USER NOTE + ARTICLE |
| `source_from_info(info, url=None)` → `dict` | Build the `source` dict from yt-dlp info |
| `source_from_article(article)` → `dict` | Build the `source` dict from article extraction |

#### Exceptions
- `URLRejected(tag, message)` — we recognise the URL but refuse it; `tag` is the user-facing code (`TIKTOK_PHOTO`, `YT_SHORTS_ONLY`, `VIDEO_TOO_LONG`)
- `URLUnsupported` — yt-dlp doesn't recognise the URL; caller should try article extraction

#### Tool schema (`SAVE_NUGGET_TOOL`)
Anthropic tool definition forcing structured output. Required fields: `title`, `folder`, `summary`, `mentioned`, `fact_check`, `tags`, `ocr_text`. Folder is constrained to the 12-folder enum at the schema level.

### `database.py` — Supabase REST client

| Function | Purpose |
|---|---|
| `get_today_count(user_id)` → `int` | Counts today's UTC entries for that user (used for quota) |
| `save_entry(*, user_id, media_type, raw_content, title, summary, tags, folder, fact_check, enrichment, formatted_output, message_id=None)` → `dict` | INSERT with `return=representation`; returns saved row including id |
| `delete_entry(entry_id, user_id)` → `bool` | DELETE constrained by `user_id` — won't delete other users' entries |

Notes:
- All functions are synchronous; bot wraps them in `asyncio.to_thread`
- `enrichment` is passed pre-stringified (caller does the JSON encoding)
- No retry logic — failures bubble up to the caller for explicit handling

---

## 3. Frontend TypeScript modules

### `lib/nuggets.ts`

#### Types
```ts
interface Nugget {
  id: number
  title: string
  summary: string              // first bullet, for card preview
  summaryBullets: string[]     // full list, for detail page
  folder: string
  date: string                 // raw ISO from DB
  dateCompact: string          // '2026.05.24' for display
  tags: string[]
  source: string               // 'TG_BOT' | 'TEXT' | 'IMAGE' | 'VIDEO_URL' | …
  mentioned: Mentioned[]
  factChecks: FactCheck[]
  transcript: string           // raw_content
  extractedLinks: string[]
  sourceInfo?: SourceInfo      // present for URL-derived entries
}

interface SourceInfo {
  url: string
  platform?: string
  uploader?: string
  durationS?: number
  kind?: 'video' | 'images' | 'article' | string
}
```

#### Functions
| Function | Purpose |
|---|---|
| `mapRowToNugget(row: EntryRow)` | Single source of truth for DB row → Nugget mapping |
| `parseSummaryBullets(raw)` | Tolerates `["a","b"]` or plain string |
| `parseTags(raw)` | Tolerates JSON array OR space/comma-separated hashtag string |
| `parseMentioned(raw)` | Walks any top-level array in enrichment, dedupes |
| `parseFactChecks(raw)` | Normalises `claim`/`term`, `evidence`/`reasoning` field variants |
| `parseSourceInfo(raw)` | Reads flat `source_*` keys from enrichment JSON |
| `formatDuration(seconds)` | `79 → "1:19"`, `3725 → "1:02:05"` |
| `sourceHeaderLine(info)` | `"TikTok · @user · 1:19"` |

### `lib/supabaseClient.ts` / `lib/supabaseAdmin.ts`
- `supabaseClient` — anon key, browser-safe, read-only in practice
- `supabaseAdmin` — secret key, **server-only** (never imported into client components)

### Server actions (`actions/`)
| Action | Updates | Auth |
|---|---|---|
| `updateFolder(id, folder)` | `entries.folder` | secret key |
| `updateTags(id, tags)` | `entries.tags` (re-stringified) | secret key |
| `deleteEntry(id)` | DELETE | secret key |

⚠️ Known frontend bug (Phase C cleanup): edit/delete actions don't always write back to Supabase. Tracked in CLAUDE.md.

---

## 4. Environment variables

| Key | Required for | Notes |
|---|---|---|
| `BOT_TOKEN` | bot | From @BotFather. Rotate via `/revoke` if leaked. Never paste in chat. |
| `ADMIN_ID` | bot | Telegram user_id; admin bypasses quota |
| `SUPABASE_URL` | bot + web | e.g. `https://yncxcnfgiwdfnxkigodo.supabase.co` |
| `SUPABASE_SECRET_KEY` | bot | server-side INSERT/DELETE |
| `NEXT_PUBLIC_SUPABASE_URL` | web | mirror of SUPABASE_URL, exposed to client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | read-only client key |
| `ANTHROPIC_API_KEY` | bot | Claude calls |
| `OPENAI_API_KEY` | bot | Whisper calls (video/URL-video) |
| `WEB_URL` | bot (optional) | URL for `⬈ OPEN` button. Must be `https://`, else button hidden |
| `CLAUDE_MODEL_TEXT` | bot (optional) | override Haiku model id |
| `CLAUDE_MODEL_VISION` | bot (optional) | override Sonnet model id |

Setup: use `setup_env.sh` in the bot folder for interactive prompts. Avoid TextEdit (iCloud autosave can swallow `.env` writes).
