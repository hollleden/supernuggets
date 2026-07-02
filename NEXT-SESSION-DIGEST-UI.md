# Supernuggets Sprint 2 — Digest UI (Next Session Prompt)

**Copy this entire section into a new chat to continue Sprint 2 Item #2.**

---

## Context

Princess here. I'm continuing **Sprint 2 of the Supernuggets bot** — we just shipped the digest scheduler infrastructure (Phase D). Now building the web UI to view digests.

**Previous work (2026-07-02):**
- ✅ Phase D digest scheduler complete: `/timezone`, `/digest_on`, `/digest_off`, `/digest_status` commands + APScheduler job wired into bot
- ✅ All 60 tests pass, code pushed to Railway
- Digest scheduler is waiting for:
  1. User testing (I'll test the commands)
  2. Database schema update: add `timezone` and `digest_on` columns to `users` table
  3. `DIGEST_ENABLED=1` set in Railway env to actually send digests

**Now:** Building **Item #2 — Digest Web History Page**. This is the UI users see to browse all their sent digests.

---

## Sprint 2 Scope (3 items, ~10–12 hours total)

1. ✅ Phase D digest scheduler (4–5h) — SHIPPED
2. ⏳ **Digest web history page (3–4h) — THIS ITEM** — UI to view all sent digests + individual digest detail pages
3. ⏳ Unique digest links (30m) — just makes #2 shareable; unblocks after #2

---

## Item #2: What to Build

### Routes to Create (Next.js)

**`app/u/[token]/digests/page.tsx`** (Gallery)
- List all digests sent to this user (newest first)
- Show: type (Weekly/Monthly/Year), date range, "View" link
- Data: fetch from Supabase `digests` table where `user_id` matches token
- Layout: grid or list (your choice)

**`app/u/[token]/digests/[id]/page.tsx`** (Detail)
- Show full digest text (already formatted as HTML in the DB)
- Date range + type header
- "← Back to digests" link
- Optional: "Share" button (copies URL)

### Helper Library

**`lib/digests.ts`** (new file)
- `fetchUserDigests(token: string)` — fetch all digests for user
- `fetchDigestById(token: string, digestId: number)` — fetch one digest
- Type: `Digest { id, user_id, kind, period_start, period_end, body, created_at }`

### UI Updates

**`components/vault/app-shell.tsx`**
- Add nav link: "📊 Digests" or "📈 History" → `/u/[token]/digests`

### Database

No changes needed. `digests` table (in bot repo) already has everything. Just read via RLS.

---

## Key Information

### Digest Data Structure
From Supabase `digests` table:
```
id: number
user_id: number
kind: 'weekly' | 'monthly' | 'yir'
period_start: string (ISO date, e.g. "2026-06-24")
period_end: string (ISO date, e.g. "2026-06-30")
body: string (HTML-formatted digest text, ready to render)
created_at: string (ISO timestamp)
clusters: json (optional, only for monthly/yir)
```

The `body` field is already HTML — render it with `dangerouslySetInnerHTML` or a sanitized HTML component. It contains tags like `<a href="...">`, `<b>`, etc.

### Token-Based RLS
- Your vault routes already use this pattern
- Server Component reads `[token]` from URL
- Server action looks up `user_id` from token
- RLS policy checks `user_id` matches

Use the same pattern for digest routes.

### Timeline
- 3–4 hours if no blockers
- Can work independently of scheduler testing

---

## Critical Context

**Read these memory files for backlog + known gotchas:**
- `memory/project_supernuggets.md` — current state, backlog, shipping history
- `memory/feedback_test_instructions.md` — after every fix, give explicit test steps (user is non-technical)

**CLAUDE.md** → uses RTK (Rust Token Killer) for token optimization. Git commands auto-optimized (transparent).

---

## Files to Touch

- `lib/digests.ts` — new file, fetch logic
- `app/u/[token]/digests/page.tsx` — new file, gallery view
- `app/u/[token]/digests/[id]/page.tsx` — new file, detail view
- `components/vault/app-shell.tsx` — add nav link to digests

---

## After This Item

Once #2 is done, Item #3 (unique digest links) is automatic — the routes already make each digest shareable. 30 minutes of verification + polish.

---

## Getting Started

1. Read the full handoff: `HANDOFF-2026-07-02.md` in this repo (describes in detail)
2. Read the bot handoff: `~/supernuggets-bot/HANDOFF-2026-07-02.md` (for context on scheduler)
3. Start with `lib/digests.ts` (fetch functions)
4. Build gallery page (`digests/page.tsx`)
5. Build detail page (`digests/[id]/page.tsx`)
6. Add nav link in AppShell
7. Test in local dev server

---

## Test Steps (After Shipping #2)

1. Open vault at `supernuggets.app/u/[token]/`
2. Trigger a manual digest: send `/digest_week` to bot (admin command, only I can do)
3. Digest saves to DB
4. Reload vault, click "📊 Digests" in sidebar
5. See the digest in the list
6. Click "View"
7. See full digest rendered
8. Copy URL → should work for anyone with that token

---

## User Notes

- **Non-technical user** — give explicit step-by-step test instructions after every change
- **Manual verification** — user tests all features themselves
- **RTK active** — git commands auto-optimized (you don't need to do anything)
- **Memory system** — I'll update project memory after this session

---

## Go!

Start with `lib/digests.ts` to understand the data shape, then build the pages.

