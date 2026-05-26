# supernuggets — Software Requirements Specification (SRS)

**Version:** 1.0
**Date:** 2026-05-26
**Status:** Pipeline complete (Phase B); discovery + scheduler + multi-user pending.

---

## 1. Introduction

### 1.1 Purpose
This SRS formalises the requirements for **supernuggets**, a personal "second brain" composed of a Telegram ingestion bot and a Pinterest-style web vault, both backed by a shared Supabase Postgres database.

### 1.2 Scope
The system shall:
- Accept any common content type (text, photo, video, social-media URL, article URL) sent to a Telegram bot
- Use AI (Claude + Whisper + trafilatura + yt-dlp) to transcribe, summarise, fact-check, tag, and classify the content
- Persist the structured output to Supabase
- Surface saved content in a web grid with filter, search, and detail views

Out of scope (this version):
- Multi-user support with per-user isolation (Phase C — magic URL + RLS)
- Bot menus / `/commands` for browsing (Phase B remainder)
- Scheduled summaries / digests (Phase B remainder)
- Native TikTok photo carousel ingestion (HIGH backlog)

### 1.3 Definitions
| Term | Meaning |
|---|---|
| Nugget | One saved item — a row in `entries` |
| Folder | One of 12 fixed top-level categories |
| Receipt | The HTML message the bot sends back after saving |
| Ingest | The end-to-end process from input → AI → DB → receipt |
| Source URL | The original web URL when the nugget came from a link |

---

## 2. Overall description

### 2.1 Product perspective
Standalone personal-knowledge system. No third-party integrations beyond AI APIs (Claude, Whisper) and the media downloaders (yt-dlp, trafilatura). The Telegram bot is the only ingestion surface; the web app is the only browsing surface.

### 2.2 User class
- **Owner** (admin) — the single human user of the system today
- (Phase C) **Friends/collaborators** — granted per-vault tokenized URLs

### 2.3 Operating environment
- **Bot:** Python 3.14 on macOS (dev) / Railway (planned prod); polling-based, no inbound HTTP
- **Web:** Next.js 16 deployed to Vercel; SSR with Supabase reads
- **Storage:** Supabase Postgres (free tier for now)
- **AI providers:** Anthropic Claude API + OpenAI Whisper API (account-billed)

### 2.4 Constraints
- Telegram bot API caps file downloads at 20MB
- Telegram messages cap at 4096 characters
- Whisper input limited to 25MB per call
- Anthropic prompt caching has a 5-minute TTL
- Supabase free tier provides 500MB DB + 1GB storage
- Per-platform native upload limits (TikTok 10 min, IG Reels 90s, etc.)

### 2.5 Assumptions
- The owner uses Telegram daily and trusts the AI's classification
- Single-user mode is acceptable until Phase C
- Source URLs remain reachable (we don't archive the underlying media)

---

## 3. Functional requirements

### 3.1 Ingestion

**FR-1 Text ingest.** The bot SHALL accept any text message and produce a nugget.

**FR-2 Single photo ingest.** The bot SHALL accept a single photo (optional caption) and produce a nugget combining OCR + AI analysis.

**FR-3 Photo album ingest.** The bot SHALL accept up to 10 photos with a shared `media_group_id` and produce ONE nugget covering all of them.

**FR-4 Video ingest.** The bot SHALL accept direct video uploads (mp4, mov, etc.) up to 20MB, transcribe the audio via Whisper, and produce a nugget.

**FR-5 Video URL ingest.** The bot SHALL detect URLs to TikTok, Instagram Reels, YouTube Shorts, Twitter/X, Pinterest, Reddit, and Threads videos; download via yt-dlp; transcribe; and produce a nugget with the original URL preserved.

**FR-6 Image URL ingest.** The bot SHALL detect Instagram photo posts/carousels; download all images via yt-dlp/httpx; run the vision pipeline; produce one nugget.

**FR-7 Article URL ingest.** The bot SHALL detect article URLs (anything yt-dlp doesn't recognise); extract main text via trafilatura; route to the text pipeline.

**FR-8 Mixed messages.** When a text message contains both prose and a URL, the bot SHALL treat the URL as the primary input and the surrounding prose as a "USER NOTE" caption for the AI.

### 3.2 Rejection

**FR-9 Daily quota.** Non-admin users SHALL be limited to 5 entries per UTC day. Over-quota requests SHALL receive `[limit] N/5 today, resets in Xh Ym`.

**FR-10 Size cap.** Direct video uploads exceeding 20MB SHALL be rejected with `[limit] VIDEO_TOO_LARGE`.

**FR-11 Duration caps.** URL videos exceeding their platform-specific cap (see [ARCHITECTURE.md §5.2](ARCHITECTURE.md#52-duration-caps-rationale)) SHALL be rejected with `[limit] VIDEO_TOO_LONG`.

**FR-12 YouTube non-Shorts.** YouTube URLs without `/shorts/` SHALL be rejected with `[limit] YT_SHORTS_ONLY`.

**FR-13 TikTok photos.** TikTok URLs containing `/photo/` SHALL be rejected with `[limit] TIKTOK_PHOTO` and a pointer to use @SaveAsBot.

**FR-14 Unsupported URLs.** URLs that fail both yt-dlp and article extraction SHALL be rejected with `[unsupported] URL_NOT_RECOGNIZED`.

### 3.3 AI processing

**FR-15 Folder classification.** Every nugget SHALL be assigned exactly one folder from the 12-folder taxonomy. If the AI emits an out-of-enum folder, the system SHALL fall back to `Personal`.

**FR-16 Summary.** Every nugget SHALL include 2-3 bullet-point summary sentences, each one line, content-rich.

**FR-17 Mentions.** Every nugget SHALL include a (possibly empty) array of mentioned entities (brands, people, places, tools) with search-query URLs.

**FR-18 Fact-check.** Every nugget SHALL include a (possibly empty) array of fact-checkable claims with one-sentence evidence statements.

**FR-19 Tags.** Every nugget SHALL be assigned 3-5 hashtag tags, lowercase with underscores. The folder name SHALL NOT appear as a separate tag.

**FR-20 Title.** Every nugget SHALL have a UPPERCASE title ≤ 60 characters, no decorative subtitle.

**FR-21 OCR for images.** For image-mode entries, the AI SHALL transcribe ALL visible text into the `ocr_text` field verbatim. Empty string only when no text is visible.

### 3.4 Receipt rendering

**FR-22 Receipt format.** Every saved nugget SHALL produce an HTML receipt with the structure: `[FOLDER] TITLE` → SUMMARY → MENTIONED (if any) → FACT-CHECK (if any) → TRANSCRIPT → TAGS → SOURCE (if URL-derived).

**FR-23 Length safety.** Receipts SHALL fit within 4000 characters; transcripts truncate with `… (truncated — full text on web)` notice when over budget.

**FR-24 Inline buttons.** Each receipt SHALL include action buttons: `⬈ OPEN` (https only) → web detail page; `↗ SOURCE` (URL entries only) → original URL; `⌫ DELETE` → confirmation flow.

**FR-25 No emoji.** Status messages (errors, warnings, limits) SHALL use bracketed text tags (`[err]`, `[warn]`, `[limit]`, etc.), never picture emojis. Unicode geometric symbols (`▪ • ✓ ✗ ⌫ ⬈ ↗`) are permitted.

### 3.5 Persistence

**FR-26 Database write.** Every successful nugget SHALL be inserted into `entries` with all metadata fields populated.

**FR-27 Source URL persistence.** URL-derived entries SHALL store `source_url`, `source_platform`, `source_uploader`, `source_duration_s`, `source_kind` as flat keys in the `enrichment` JSON column.

**FR-28 UTC consistency.** `created_at` and quota counting SHALL both use UTC date — not server local time.

**FR-29 Soft delete.** The `⌫ DELETE` button SHALL require a `✓ YES DELETE` confirmation step before any DB write. Cancellation SHALL restore the original keyboard.

**FR-30 Owner-scoped delete.** A delete SHALL only succeed if the requesting user's `user_id` matches the entry's `user_id`.

### 3.6 Web vault

**FR-31 Grid view.** The web app SHALL display all entries in a responsive grid filtered by folder.

**FR-32 Detail view.** Clicking a card SHALL open a detail page showing the full transcript, mentioned entities, fact-checks, tags, source link, and editable folder/tags.

**FR-33 Source surfacing.** Cards SHALL show a `↗ {Platform} · @{uploader}` line above tags for URL-derived entries. Detail pages SHALL render a full SOURCE section between title and SUMMARY.

**FR-34 Search.** The web app SHALL support filtering by folder selection and tag click-through.

---

## 4. Non-functional requirements

### 4.1 Performance

**NFR-1 Ingest latency.** End-to-end ingest (text) SHALL complete within 30 seconds at p95. Video URL ingest SHALL complete within 60 seconds at p95 for clips ≤ 60s.

**NFR-2 Web cold load.** Grid view SHALL render initial entries within 3 seconds on Vercel cold start.

**NFR-3 Prompt caching.** System prompt + tool schema SHALL be cached with Anthropic's ephemeral cache control to achieve ~90% input-token discount on hot calls.

### 4.2 Cost

**NFR-4 Per-ingest budget.** Average cost per ingest SHALL stay under $0.05. Per-platform duration caps SHALL bound worst-case Whisper spend to ~$0.06.

**NFR-5 Monthly budget.** Total monthly AI spend (Claude + Whisper) SHALL stay under $20 at 50 ingests/day.

### 4.3 Reliability

**NFR-6 Idempotent failure.** Any error before successful DB insert SHALL result in NO partial save. Errors after a successful insert SHALL preserve the data and notify the user that the chat-side render failed.

**NFR-7 Recovery on restart.** The bot SHALL resume polling cleanly after process restart with no state loss (Telegram queues missed updates).

**NFR-8 Telegram conflict handling.** When `TelegramConflictError` occurs, the bot SHALL log the event and back off; the operator SHALL `/revoke` the token rather than using API trickery.

### 4.4 Security

**NFR-9 Secret storage.** All API keys (BOT_TOKEN, Anthropic, OpenAI, Supabase secret) SHALL live in `.env` only; `.env` SHALL be gitignored.

**NFR-10 Bot token handling.** Bot tokens SHALL NEVER be transmitted in plain text via chat with any LLM or third-party service. Token rotation SHALL be done via `setup_env.sh` or direct file edit only.

**NFR-11 Frontend exposure.** The frontend SHALL use only the Supabase anon key (read-only). Mutations go through server actions with the secret key.

**NFR-12 Webhook safety.** The bot SHALL NEVER call Telegram `setWebhook` to a domain it does not own. (Reference: ToS-violation incident in [CLAUDE.md Bot history](../CLAUDE.md#bot-history-which-token-is-live).)

### 4.5 Maintainability

**NFR-13 Single source of truth for the 12 folders.** Folder list SHALL appear in exactly two places: `pipeline.py` and `lib/nuggets.ts`. Adding a folder SHALL require updating both and nothing else.

**NFR-14 Tool schema discipline.** The Claude tool schema SHALL use `additionalProperties: false`, explicit `required` arrays, and `minItems`/`maxItems` on arrays — to prevent model output drift.

**NFR-15 Documented gotchas.** Bugs discovered in production SHALL be captured in `CLAUDE.md` "Gotchas" or "Bot history" sections to prevent regression.

### 4.6 Ethics

**NFR-16 No paywall bypass.** The article extractor SHALL only see what an anonymous browser would see. No cookies, no logged-in scraping, no DRM circumvention.

**NFR-17 Source attribution.** URL-derived nuggets SHALL always preserve and surface the original URL — both in receipts (button + footer) and in the web UI (card + detail).

---

## 5. Out-of-scope (explicit non-requirements)

- Real-time collaboration / shared vaults
- Mobile native app (web is responsive)
- Native TikTok photo carousel ingestion (use @SaveAsBot workaround)
- Articles behind login walls (Twitter long posts, LinkedIn, etc.)
- Audio podcasts > 5 minutes (Whisper cost prohibitive)
- YouTube videos longer than 60 seconds (Shorts only)
- E2E encryption (single-user vault, secret key on server)

---

## 6. Acceptance criteria (current release)

The system is considered Phase-B-complete when:

- [x] Bot accepts and saves all 7 input types (text, photo, album, video, video URL, image URL, article)
- [x] All 7 input types render a complete receipt with SOURCE footer where applicable
- [x] Web frontend displays the 12-folder grid with filters
- [x] Web detail page shows all sections including SOURCE link for URL-derived entries
- [x] Daily quota enforces 5 entries/day for non-admin
- [x] Delete flow requires confirmation and is user-scoped
- [x] OCR text is verbatim for image entries (forced via tool-schema `required`)
- [x] Documentation reflects the live system state
- [ ] Bot deployed to Railway (Phase B remainder)
- [ ] Menus + scheduler shipped (Phase B remainder)

---

## 7. Revision history

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-26 | Initial SRS. Captures Phase A + Phase B (through pipeline complete). |
