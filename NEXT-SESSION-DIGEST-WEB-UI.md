# Supernuggets Sprint 2 Item #2 — Digest Web UI (Next Session Prompt)

**Copy this entire section into a new chat to continue Sprint 2 Item #2.**

---

## Context

Princess here. I'm continuing **Sprint 2 of the Supernuggets bot** — we just completed and tested Phase D digest scheduler.

**Previous work (2026-07-02):**
- ✅ Phase D digest scheduler complete & tested
  - `/timezone` command: detects timezone from location (tested: Barcelona → Europe/Madrid)
  - `/digest_on` / `/digest_off` commands: toggle automatic digest sending
  - `/digest_status` command: show preferences
  - APScheduler infrastructure wired in, ready to send weekly/monthly/yearly digests
  - All 60 tests pass
  - Code pushed to Railway and live

**Scheduler status:** Infrastructure complete. Won't actually send digests until `DIGEST_ENABLED=1` is set in Railway (currently gated at 0 for safety).

**Now:** Building **Item #2 — Digest Web History Page**. This is the Next.js UI where users see all their sent digests.

---

## Sprint 2 Scope (3 items)

1. ✅ Phase D digest scheduler — SHIPPED & TESTED
2. ⏳ **Digest web history page (3–4h) — THIS ITEM**
3. ⏳ Unique digest links (30m) — auto-unblocked after #2

---

## Item #2: What to Build

### Routes to Create (Next.js)

**`app/u/[token]/digests/page.tsx`** (Gallery View)
- List all digests sent to this user (newest first)
- Display: type (Weekly/Monthly/Year), date range, "View" button
- Fetch from Supabase `digests` table where `user_id` matches token
- Layout: grid or list (your choice)
- No mutations — read-only

**`app/u/[token]/digests/[id]/page.tsx`** (Detail View)
- Show full digest text (already formatted as HTML in DB)
- Header with type + date range
- "← Back to digests" link
- Optional: "Share" button (copies URL to clipboard)
- No mutations — read-only

### Helper Library

**Create `lib/digests.ts`** with these functions:

```typescript
export interface Digest {
  id: number;
  user_id: number;
  kind: 'weekly' | 'monthly' | 'yir';
  period_start: string; // ISO date
  period_end: string;   // ISO date
  body: string;         // HTML digest text (ready to render)
  created_at: string;   // ISO timestamp
}

// Fetch all digests for a user
export async function fetchUserDigests(token: string): Promise<Digest[]>

// Fetch a single digest by ID
export async function fetchDigestById(token: string, digestId: number): Promise<Digest | null>
```

Both functions should:
1. Convert token → user_id (verify RLS)
2. Fetch from Supabase `digests` table
3. Return data or null

### UI Updates

**`components/vault/app-shell.tsx`** — add nav link to digests:
```
📊 Digests  →  /u/[token]/digests
```

Or whatever emoji/label you prefer (📈 History, 📋 Digests, etc.)

---

## Database Info

**Supabase `digests` table schema:**
```
id: bigint (primary key)
user_id: bigint (FK to users.user_id)
kind: text ('weekly' | 'monthly' | 'yir')
period_start: date
period_end: date
body: text (HTML-formatted digest)
created_at: timestamp
clusters: json (optional, only for monthly/yir)
```

**No schema changes needed** — this table already exists with all the data from the scheduler (once digests are sent).

**RLS:** Supabase RLS is enabled on `digests` table. Only the user's own digests are visible (scoped by user_id).

---

## Implementation Notes

### How to Fetch

Use the same token-based RLS pattern your vault already uses:
1. Server Component reads `[token]` from URL
2. Server action looks up `user_id` from token
3. Query digests where `user_id` matches
4. RLS policy enforces the user_id match

### Rendering the Digest Body

The `body` column is pre-formatted HTML (same format sent to Telegram):
- Contains tags: `<a href="...">`, `<b>`, etc.
- Use `dangerouslySetInnerHTML` or a sanitized HTML component
- No further formatting needed

### Styling

Match your existing vault aesthetic:
- Gallery page: clean card grid (like nugget cards)
- Detail page: white space, readable typography
- Dark mode: already supported via your `dark:` Tailwind variants

### Empty State

If user has no digests yet:
- Show: "No digests yet. Enable `/digest_on` in the bot and digests will appear here."
- Link to bot with `/digest_on` command

---

## Timeline & Scope

- **Estimate:** 3–4 hours
- **Blockers:** None — scheduler (#1) is complete
- **Must-haves:** Both routes + nav link
- **Nice-to-haves:** Share button, empty state message, date formatting

---

## Critical Context

**Read these for backlog + known gotchas:**
- `memory/project_supernuggets.md` — full project state
- `memory/feedback_test_instructions.md` — after every fix, give test steps (non-technical user)

**CLAUDE.md** → uses RTK (Rust Token Killer) for token optimization.

---

## Files to Touch

- `lib/digests.ts` — new, fetch helpers
- `app/u/[token]/digests/page.tsx` — new, gallery view
- `app/u/[token]/digests/[id]/page.tsx` — new, detail view
- `components/vault/app-shell.tsx` — modify, add nav link

---

## After Item #2

Item #3 (unique digest links) is automatic — the routes from #2 already make each digest shareable. Just needs verification + polish.

---

## Test Plan

Once #2 is built:
1. Manually send `/digest_week` as admin (in bot) to create a test digest
2. Reload vault at supernuggets.app/u/[token]/
3. Click "📊 Digests" in sidebar
4. See the digest in the list
5. Click "View"
6. See full digest rendered correctly
7. Test "Back" link
8. Optional: Test "Share" button (copy to clipboard)

---

## Go!

Start with `lib/digests.ts` to understand the data shape, then build the gallery page, then the detail page.

