# Changelog

All notable changes to supernuggets. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Bot menus: `/recent`, `/today`, `/folder <name>`, `/search <q>` (inline keyboards)
- Weekly digest scheduler (APScheduler)
- Railway deploy
- Native TikTok photo carousel ingestion (HIGH backlog)

---

## [0.5.0] — 2026-05-26 — "Pipeline complete"

### Added
- **URL handler** — bot detects http(s) URLs in text messages and routes them through:
  - **yt-dlp** for TikTok video, Instagram Reel + photo carousel, YouTube Shorts, Twitter/X video, Pinterest, Reddit, Threads. Per-platform duration caps (YT 60s, IG 180s, Twitter 140s, TikTok 600s, default 300s). YouTube non-Shorts URLs explicitly rejected. TikTok `/photo/` URLs rejected with @SaveAsBot pointer (yt-dlp limitation).
  - **trafilatura** as the article-URL fallback (Substack, Medium, news, blogs).
- **`↗ SOURCE` inline button + receipt footer** for URL-derived entries. Original URL preserved everywhere.
- **Source URL storage** in the existing `enrichment` JSON column (no schema migration): flat keys `source_url`, `source_platform`, `source_uploader`, `source_duration_s`, `source_kind`.
- **Web UI SOURCE display**:
  - Cards now show `↗ {platform} · @{uploader}` above tags for URL-derived nuggets
  - Detail page shows a full SOURCE section between title and SUMMARY
- **Article ingestion** with `media_type="article"`. Honest scope: trafilatura sees only what an anonymous browser sees (no paywall bypass).
- New project docs in `docs/`: `ARCHITECTURE.md`, `API.md`, `SRS.md`, `DEPLOYMENT.md`. Root `README.md` + this `CHANGELOG.md`.

### Changed
- `pipeline.render(parsed, raw_content, source=None)` — third optional arg appends SOURCE footer (after TAGS) and adjusts transcript truncation budget accordingly.
- `pipeline.process_text(text, source=None)` and `pipeline.process_images(images, caption, source=None)` thread the source through to `render()`.
- `bot._save_and_reply(*, ..., source=None)` embeds source keys into enrichment JSON, passes URL to `entry_keyboard`.
- `bot.entry_keyboard(entry_id, source_url=None)` — adds `↗ SOURCE` button when `source_url` provided.
- `bot.on_text` now URL-checks first via `pipeline.find_first_url`; messages containing a URL dispatch to `_handle_url`.

### Fixed
- `ocr_text` field promoted to `required` in the `save_nugget` tool schema + emphatic OCR demand added to the vision addendum. Sonnet was skipping verbatim OCR for text-heavy albums to save tokens; result was TRANSCRIPT showing `[image — no text extracted]` even when images were full of text.

### Security
- Bot history: second token for `@supernuggetss_bot` rotated after a chat-paste leak. Tokens now flow exclusively through `setup_env.sh` / direct `.env` edit — never through chat. New rule documented in CLAUDE.md.

---

## [0.4.0] — 2026-05-25 — "Video handler"

### Added
- **Video handler** (`F.video | F.video_note`) — Whisper transcribes uploaded videos, routes through the text pipeline, saves with `media_type="video"`.
- **Caption support for videos** — Telegram captions prepended to the transcript before AI processing.
- **20MB pre-flight check** matching Telegram bot API's `getFile` cap.
- **Silent/music-only handling** — returns `[err] TRANSCRIPTION_FAILED — try a clearer audio track` when Whisper yields empty.
- `OPENAI_API_KEY` added to required env vars (Whisper).
- Lazy `_get_openai()` singleton so missing key doesn't break text/image flows.

### Fixed
- `load_dotenv()` → `load_dotenv(override=True)` so an empty `ANTHROPIC_API_KEY` shell export doesn't shadow real values in `.env`.

### Security
- Bot history: `@supernuggets_bot` (id 8945896609) received a Telegram client-side display ban after the assistant ran a `setWebhook → deleteWebhook` eviction trick pointing at `google.com/__supernuggets_evict__`. Replaced with `@supernuggetss_bot`. New rule: NEVER set webhook to a domain we don't own; NEVER use sub-second eviction tricks.

---

## [0.3.0] — 2026-05-24 — "Image handler + web UI rebuild"

### Added
- **Image handler** — single photo + album debouncer (Telegram `media_group_id` + 1.5s window). Album → one combined entry.
- **Vision pipeline** — Claude Sonnet 4.6 via `save_nugget` tool (forced).
- **Image optimizer** — Pillow resize to 1568px, JPEG q=85, strip EXIF. 3-10× upload size reduction, 30-60% vision-token savings.
- **MIME sniffing** from magic bytes (JPEG/PNG/GIF/WebP/HEIC).
- **Partial album-download tolerance** — `gather(return_exceptions=True)`.
- **Album quota pre-flight** — over-quota users rejected on first photo before downloading any.
- **Tool use** for both text and vision modes. Schema strictness: `additionalProperties: false`, `minItems`/`maxItems` (Haiku otherwise leaked literal XML `<parameter>` tags into arrays).
- **Haiku 4.5 for text mode** — ~70% cheaper than Sonnet for structured classification.
- **Web UI rebuild** to BRAND.md "tactical neo-retro blueprint" spec. Cream bg, black borders, monospaced type, 12-folder accent strips, dithered empty state. Deployed to Vercel.

### Changed
- Receipt aesthetic locked: no picture emojis, bracketed status tags (`[err]`, `[batch]`, `[FOLDER]`), `@holeden` footer on real errors.

---

## [0.2.0] — 2026-05-23 — "Text handler + AI pipeline"

### Added
- **Text handler** — Telegram message → Claude Haiku → Supabase → receipt with inline buttons.
- **DELETE flow** with `✓ YES DELETE / ✗ CANCEL` confirmation.
- **Typing indicator loop** — refreshes every 4s during long Claude calls.
- **Daily quota** — 5 entries/day for non-admin (UTC reset), unlimited for admin. Dynamic countdown in rejection message.
- **Prompt caching** on Anthropic side (~90% input-token discount on hot calls).
- **Transcript truncation** to fit Telegram's 4096-char limit.
- **HTML escape** respecting Telegram's strict entity rules (`&amp; &lt; &gt; &quot;` only; `&#x27;` rejected).
- **Folder enum normalization** — bad Claude output falls back to "Personal".
- 60s Anthropic API timeout.

---

## [0.1.0] — 2026-05-22 — "Frontend + database baseline"

### Added
- Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui frontend scaffolded via v0.dev.
- Supabase `entries` table provisioned with the schema documented in [`docs/API.md`](docs/API.md).
- 12-folder taxonomy locked in `lib/nuggets.ts` and `pipeline.py`.
- AI → Curation backfill ran for legacy data.
- Login screen removed; single-user mode established.
