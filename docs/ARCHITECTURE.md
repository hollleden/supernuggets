# supernuggets — Architecture

System design, data flow, and the key decisions behind them. Read this before changing anything that touches more than one file.

---

## 1. High-level system

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER DEVICES                            │
│                                                                  │
│   Telegram client ─────┐               ┌──── Browser            │
│                        ▼               ▼                         │
└────────────────────────┼───────────────┼─────────────────────────┘
                         │               │
                         │               │
              ┌──────────▼──────┐  ┌─────▼─────────┐
              │  TELEGRAM BOT   │  │  WEB FRONTEND │
              │  ~/supernuggets-│  │ ~/supernuggets│
              │     bot/        │  │  (Next.js 16) │
              │  (aiogram v3)   │  │               │
              │   Python 3.14   │  │  Vercel       │
              └──────────┬──────┘  └─────┬─────────┘
                         │               │
                         │  Anthropic    │
                         │  Claude API   │
                         │  (Haiku +     │
                         │   Sonnet)     │
                         │               │
                         │  OpenAI       │
                         │  Whisper API  │
                         │               │
                         ▼               ▼
                   ┌─────────────────────────┐
                   │      SUPABASE           │
                   │  Postgres + REST API    │
                   │  • entries              │
                   │  • users (Phase C)      │
                   └─────────────────────────┘
```

**Two codebases, one database.** The bot writes to Supabase (secret key, server-side). The frontend reads from Supabase (anon key, browser-safe). They never talk to each other directly.

---

## 2. Data flow per ingest type

### 2.1 Text message
```
TG message ──▶ on_text ──▶ pipeline.process_text(text)
                              │
                              └─▶ Claude Haiku (save_nugget tool, forced)
                                    │
                                    └─▶ render() → HTML receipt
                                          │
                                          └─▶ Supabase entries (POST)
                                                │
                                                └─▶ TG reply with [⬈ OPEN][⌫ DELETE]
```

### 2.2 Photo (single or album)
```
TG photo(s) ──▶ on_photo (debounce album by media_group_id, 1.5s)
                   │
                   └─▶ download photos as bytes
                          │
                          └─▶ _optimize_image (Pillow: resize 1568px, JPEG q=85, strip EXIF)
                                 │
                                 └─▶ Claude Sonnet vision (save_nugget tool)
                                       │
                                       └─▶ render → DB → TG receipt
```

### 2.3 Video (direct upload)
```
TG video ──▶ on_video (size check ≤ 20MB)
                │
                └─▶ download via bot.download(file_id)
                      │
                      └─▶ pipeline.transcribe_video → Whisper API
                            │
                            └─▶ pipeline.process_text(SOURCE prefix + transcript + caption)
                                  │
                                  └─▶ Claude Haiku → render → DB → TG receipt
```

### 2.4 URL (media — yt-dlp path)
```
TG message with URL ──▶ on_text detects URL → _handle_url
                            │
                            ├─▶ pipeline.extract_url_info(url)  [no download]
                            │      │
                            │      ├─ raises URLRejected → reply [limit] {tag}
                            │      ├─ raises URLUnsupported → fall through to article path
                            │      └─ returns info dict
                            │
                            └─▶ url_info_kind(info)
                                  │
                                  ├─ 'video'  → _ingest_url_video → yt-dlp download mp4
                                  │               → Whisper → Haiku text pipeline
                                  │               → render+source → DB → TG receipt
                                  │
                                  └─ 'images' → _ingest_url_images → httpx download images
                                                 → Sonnet vision pipeline
                                                 → render+source → DB → TG receipt
```

### 2.5 URL (article — trafilatura fallback)
```
URL where yt-dlp raises URLUnsupported
            │
            └─▶ pipeline.extract_article(url)  [browser headers, follow redirects]
                  │
                  ├─ body empty / < 80 chars → reply [unsupported] URL_NOT_RECOGNIZED
                  └─ returns {body, title, author, sitename, source_url}
                        │
                        └─▶ pipeline.process_text(SOURCE + TITLE + ARTICLE body)
                              │
                              └─▶ render+source → DB (media_type="article") → TG receipt
```

---

## 3. Key design decisions

### 3.1 Why Claude tool use (`save_nugget`) instead of JSON-in-prose
- **Eliminates JSON-parsing fragility** — no escaping bugs, no truncated brackets
- **Cuts output tokens** — no prose framing around the JSON
- **Enforces the 12-folder enum natively** — Claude can't return an invalid folder
- **Schema strictness matters** — `additionalProperties: false`, `minItems`/`maxItems`, all object fields `required`. Without this, Haiku leaked literal `<parameter name="...">` XML tags into array fields. Sonnet doesn't, but the schema constrains both consistently.

### 3.2 Why Haiku for everything (text AND vision)
- Haiku 4.5 is ~3-5× cheaper than Sonnet 4.6 for the structured-classification task
- Vision was initially on Sonnet because we worried about OCR quality on text-heavy images
- A/B tested 2026-05-26 with an 8-image skincare album packed with text overlays: Haiku held up on verbatim OCR, mentioned-brand extraction, fact-check claims, and summary quality. The OCR field being `required` in the tool schema (not optional) is what makes both models behave — without that constraint, Sonnet skipped OCR to save tokens too.
- Outcome: ~70% off every image/album call going forward
- Single `save_nugget` tool schema serves both modes (the `ocr_text` field is `required` but empty-string-OK for text mode)
- Revert is trivial: set `CLAUDE_MODEL_VISION=claude-sonnet-4-6` in `.env` and restart; no code change needed

### 3.3 Why prompt caching is non-negotiable
- System prompt + tool schema run ~1400 tokens per call
- With `cache_control: {type: "ephemeral"}`, cached reads are ~10% the cost of fresh
- 5-minute TTL — covers a "session" of back-to-back ingests but not idle hours
- Single shared SYSTEM_PROMPT + VISION_ADDENDUM concat means two cache entries (one with addendum, one without). Could be unified but the addendum's emphasis on OCR is mode-specific.

### 3.4 Why the no-emoji receipt aesthetic
- Telegram's emoji rendering is inconsistent across platforms
- ASCII bracket tags (`[err]`, `[FOLDER]`, `[limit]`) parse cleanly in monospace
- Inline buttons use Unicode geometric symbols (`⬈ ↗ ⌫ ✓ ✗ ▪ •`) which render reliably
- See [`BRAND.md`](../BRAND.md) for full spec

### 3.5 Why source URL lives in `enrichment` JSON, not a new column
- Schema migration risk avoided
- The `enrichment` column was already an open-ended JSON blob (`mentioned` array)
- Flat keys (`source_url`, `source_platform`…) read cleanly without nested unpacking
- Backwards compatible — entries without source URL just don't have those keys

### 3.6 Why we don't store the source video/image files
- Supabase storage costs $0.021/GB/month — cheap, but adds up with high-fidelity media
- Whisper transcripts and OCR text are the searchable signal; the bytes are recoverable from the source URL
- Exception: image entries that have no source URL (direct photo uploads) — backlog item to store the original via Telegram `file_id` + resize to a thumbnail

### 3.7 Why UTC everywhere
- Daily quota resets at 00:00 UTC — predictable wherever the user is
- `database.py` uses `datetime.now(timezone.utc).date()` for both `created_at` and quota counting
- Bot's `_time_until_utc_midnight()` reports the actual reset moment dynamically

---

## 4. The 12-folder taxonomy

```
Grow · Leisure · Health · Creativity · Money · Work · Curation · Personal · Beauty · Food · Travel · Sport
```

**Enforced at the bot.** Claude's `save_nugget` tool schema has `"folder": {"enum": [<12 folders>]}` so the model can't emit anything outside the list. If it somehow does (bug, jailbreak, model error), `process_text`/`process_images` falls back to `"Personal"`.

**Frontend tolerates unknowns gracefully.** `FOLDER_COLOR_HEX[nugget.folder]` falls back to the `all` color (`#1A1A1A`) for any folder it doesn't recognize. No filter tab appears for unknown folders.

**DB column is free `text`.** No PG enum. Adding a 13th folder = update the bot's enum + the frontend's `FolderType` union + re-deploy. No DB migration needed.

---

## 5. The URL handler (deep dive)

Two-path dispatch keyed on yt-dlp recognition:

| Branch | Trigger | Code path | Persisted |
|---|---|---|---|
| Video URL | yt-dlp `extract_info` returns `kind='video'` | `_ingest_url_video` → download mp4 (≤25MB) → Whisper → `process_text` | `media_type="video_url"`, `raw_content=transcript`, source in `enrichment` |
| Image carousel URL | yt-dlp `extract_info` returns `kind='images'` | `_ingest_url_images` → download via httpx → `process_images` (Sonnet vision) | `media_type="image_url"`, `raw_content=CAPTION+OCR`, source in `enrichment` |
| Article URL | yt-dlp raises `URLUnsupported` | trafilatura `extract_article` → `process_text` | `media_type="article"`, `raw_content=body`, source in `enrichment` |
| Rejected — TikTok photo | URL contains `/photo/` after resolve | `URLRejected("TIKTOK_PHOTO", ...)` | not saved; user sees [limit] message |
| Rejected — YT non-Shorts | yt-dlp extractor is youtube + URL lacks `/shorts/` | `URLRejected("YT_SHORTS_ONLY", ...)` | not saved |
| Rejected — too long | `duration > URL_DURATION_CAPS[platform]` | `URLRejected("VIDEO_TOO_LONG", ...)` | not saved |

### 5.1 Why the TikTok photo limitation
yt-dlp's TikTok extractor handles videos but bails on photo carousels (`/photo/` URLs) with "Unsupported URL". I tested manually — TikTok's HTML no longer SSR's photo URLs into `__UNIVERSAL_DATA_FOR_REHYDRATION__` (as of 2026-05-26), so even a custom scraper of the SSR'd HTML returns nothing. Photos are loaded client-side via JavaScript.

Real implementation paths are in [CLAUDE.md backlog](../CLAUDE.md#backlog-deferred). The MVP rejects with a SaveAsBot pointer.

### 5.2 Duration caps rationale
Match each platform's native upload limits so anything a real creator posts is accepted:

| Platform | Native cap | Our cap | Whisper cost worst case |
|---|---|---|---|
| YouTube Shorts | 60s | 60s | $0.006 |
| TikTok | 600s (10 min creator) | 180s | $0.018 |
| Instagram | 180s (Reels=90s) | 90s | $0.009 |
| Twitter/X | 140s (2:20) | 140s | $0.014 |
| Pinterest/Reddit/Threads/other | varies | 180s | $0.018 |

Per-URL ingest worst case ≈ $0.018 (was $0.06 pre-2026-05-26 tightening). The caps match what creators ACTUALLY post — <5% of TikToks exceed 3 min, IG Reels max out at 90s natively. Hard ceilings prevent surprise bills.

---

## 6. Failure modes & recovery

| Failure | Where | What user sees | What happens to data |
|---|---|---|---|
| Anthropic 5xx / timeout | `process_text`/`process_images` | `[err] ai pipeline failed: <details>` | nothing saved; user can retry |
| Whisper failure | `transcribe_video` | `[err] transcription failed: <details>` | nothing saved |
| Empty Whisper transcript | `_handle_url` / `on_video` | `[err] TRANSCRIPTION_FAILED — try a clearer audio track` | nothing saved |
| yt-dlp download fail | `download_url_video` | `[err] couldn't download video: <details>` | nothing saved |
| Supabase insert fail | `database.save_entry` | `[err] saved nothing — db error: <details>` | nothing saved |
| Supabase OK but TG send fail | after `save_entry` succeeds | `[warn] saved as #ID but couldn't render in chat — see web` | entry IS in DB, just no chat receipt |
| Telegram conflict (multiple pollers) | aiogram polling loop | nothing in chat; bot logs `TelegramConflictError` | bot doesn't process updates until conflict resolves |

The pattern: errors before `save_entry` succeed = nothing saved, user can retry. Errors after = data preserved, only the receipt failed.

---

## 7. The "AI brain" prompt structure

```
SYSTEM_PROMPT
  ┌─ Persona: "AI brain of supernuggets"
  ├─ Tool-format spec: arrays not nested objects, no XML tags
  ├─ Rules: folder enum, summary 2-3 bullets, mentioned coverage,
  │          fact_check criteria, tags 3-5 underscore-lowercase, title UPPERCASE
  └─ Examples of fact_check vs non-fact-check content

VISION_ADDENDUM (concatenated only for image mode)
  ┌─ "IMAGE MODE — user has sent one or more images"
  ├─ OCR REQUIREMENT (mandatory verbatim text, no summarising)
  └─ Caption framing rules; multi-image album = one cohesive entry

cache_control: ephemeral on both SYSTEM block + tools array
```

The OCR requirement was strengthened after observing Sonnet skip the `ocr_text` field on text-heavy albums. Adding `ocr_text` to the schema's `required` array + the emphatic prompt language together force verbatim transcription.

---

## 8. Phases (what we've built, what's next)

See [`CLAUDE.md`](../CLAUDE.md) Phase A/B/C for the live tracking.

| Phase | Scope | Status |
|---|---|---|
| A | Frontend wired to Supabase; 12-folder migration; UI rewrite | ✅ Done |
| B | Bot ingestion: text → image → video → URL → article; brand-locked UI | ✅ **Pipeline complete** |
| B (remainder) | Bot menus, weekly digest, Railway deploy | ⏳ Next |
| C | Multi-user (magic URL + RLS); frontend persistence fix | ⏳ Future |
