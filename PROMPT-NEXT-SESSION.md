# Next Session: Source Media Preview on Cards + Detail Page

Read ~/supernuggets/CLAUDE.md first for full architecture.

## What we're building

Add thumbnail/embed previews of source content (TikTok videos, Instagram posts, article OG images) to both the main vault grid cards and the single nugget detail page. This is a Medium-priority backlog item already in CLAUDE.md.

## Why

Most entries come from TikTok/Instagram/YouTube URLs. The bot downloads and transcribes video, but **no thumbnail or preview image is saved**. Cards are text-only. Adding visual previews makes the grid feel alive.

## What needs to happen

### 1. Bot side (`~/supernuggets-bot`)

**Persist thumbnail URL during ingestion.** yt-dlp already provides a `thumbnail` field in its info dict. Save it into the existing `enrichment` JSON column.

Files to modify:
- `pipeline.py` — `source_from_info(info)`: add `'thumbnail_url': info.get('thumbnail', '')` to the source dict.
- `pipeline.py` — `source_from_article()`: check if trafilatura returns an OG image URL, include as `thumbnail_url`.
- `database.py` — no changes needed (enrichment is free-form JSON).

**No schema migration needed.**

### 2. Frontend side (`~/supernuggets`)

**Parse thumbnail URL:**
- `lib/nuggets.ts` — `parseSourceInfo()`: add `thumbnailUrl?: string` to `SourceInfo`, parse `enrichment.thumbnail_url`.

**Grid cards:**
- `components/vault/nugget-card.tsx` — if `nugget.sourceInfo?.thumbnailUrl` exists, show `<img>` at top of card (`object-cover rounded-t-xl`, `loading="lazy"`). Graceful fallback on error (hide image, show text-only card).

**Detail page:**
- `app/u/[token]/n/[id]/page.tsx` — show preview in SOURCE section. For videos, consider TikTok/YouTube embed iframes with static thumbnail fallback.

**Constraints:**
- Use regular `<img>` (NOT Next.js `<Image>`) to avoid configuring every CDN domain in `next.config.ts`.
- TikTok thumbnails are on `p16-sign.tiktokcdn.com` etc. — they may expire. Handle gracefully.
- Don't break existing text-only cards.

### 3. Backfill (optional)

After bot deploy, new entries get `thumbnail_url`. For existing ~154 entries, could write a one-time script using yt-dlp `extract_info` on stored `source_url`. Or accept old entries stay text-only.

## Key files

| File | Role |
|---|---|
| `~/supernuggets-bot/pipeline.py` | `source_from_info()`, `source_from_article()` — add thumbnail_url |
| `~/supernuggets/lib/nuggets.ts` | `parseSourceInfo()`, `SourceInfo` type |
| `~/supernuggets/components/vault/nugget-card.tsx` | Grid card — add thumbnail |
| `~/supernuggets/app/u/[token]/n/[id]/page.tsx` | Detail page — add preview/embed |

## Design notes

- Cards: `.nugget-card` class, 12px border-radius, folder-color hover. Thumbnail at top, full-width, content below.
- Detail page: `rounded-2xl` white cards, `border-gray-200`. Larger preview in SOURCE section.
- Use `superpowers:brainstorming` skill before implementing — open questions about embed vs thumbnail, fallback behavior, card height consistency.

## Recent UI session context (2026-06-23)

This session completed a major visual redesign:
- Nugget detail page rebuilt per HTML reference (12-col grid, rounded-2xl, colored bullets, chip mentions, emerald fact-checks, RAW CAPTURE PAYLOAD)
- Static top bar (was scrolling marquee), cleaned text
- Pixel-art SVG cursors (default arrow, pointer hand, I-beam text, hourglass wait)
- Pixel nugget logo + favicon
- Removed BROWSE button (logo is clickable), removed ALL folder
- RESURFACE → RANDOM NUGGET
- Folders sorted alphabetically
- Dark mode: manual toggle only (no OS auto-detect)
- 95% font-size scaling
- CursorWaitOnNav component for loading state

## How the owner works

- Non-technical. Approve-and-paste. Wants to understand decisions.
- "One thing at a time. Don't dump."
- After every fix: explicit test steps (what to open, pass signal, fail signal).
- Use brainstorming skill before architectural changes.
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com> in commits.

## Don't

- Don't download/store thumbnail binaries — just CDN URLs
- Don't use Next.js `<Image>` without configuring remotePatterns
- Don't change bot receipt format or Telegram output
- Don't break text-only card layout
