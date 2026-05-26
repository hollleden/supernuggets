# HANDOFF — Phase C: multi-user (magic URL + RLS)

**Context:** Ingestion pipeline is **feature-complete** (text, photos, video, video URL, photo carousels, articles) and cost-optimized (~$3-4/mo). The vault has been single-user since day one — `user_id` IS stored on every row, but the frontend reads `SELECT *` and shows everything to anyone with the URL. This session locks the vault per user and ships **magic URL** auth: the bot DMs each user a personal `supernuggets.app/u/<token>` URL on `/start`; that token resolves to their entries only. After magic URLs work, **enable Postgres RLS** to make the lockdown structural rather than just convention.

**Read first:**
- [`CLAUDE.md`](CLAUDE.md) — full living state. Phase C section + "Bot history" + "Telegram API safety" are mandatory reading.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — data flow per ingest type; the `entries` row shape.
- [`docs/API.md`](docs/API.md) — Supabase schema. **The `users` table is "reserved" but does not yet exist** — you'll create it.
- [`~/supernuggets-bot/database.py`](../supernuggets-bot/database.py) — `save_entry` already stores `user_id`; you'll add user CRUD + token lookup.
- [`~/supernuggets-bot/bot.py`](../supernuggets-bot/bot.py) — `on_start` is where you'll DM the magic URL. `entry_keyboard`'s OPEN button URL needs the token appended.
- [`~/supernuggets/app/page.tsx`](app/page.tsx) — current home, reads ALL entries. Will be replaced with a no-data landing page.
- [`~/supernuggets/app/n/[id]/page.tsx`](app/n/[id]/page.tsx) — detail page; will be moved under `app/u/[token]/n/[id]/page.tsx`.
- [`~/supernuggets/actions/`](actions/) — server actions for folder/tag/delete mutations. **Known bug**: they may not actually write to Supabase. Investigate before assuming they work post-token-scope.
- TeleForge patterns reference: https://github.com/zerox9dev/TeleForge (steal, don't fork) — useful if any bot UX touches this.

**Run the bot locally:** `cd ~/supernuggets-bot && .venv/bin/python bot.py`

**Kill bot reliably:** `kill -9 $(ps -ef | grep "bot.py" | grep -v grep | awk '$NF=="bot.py" {print $2}')` — **NOT** `pkill -f`. See CLAUDE.md "Killing the bot reliably" for why.

---

## What's done (previous session, 2026-05-26)

- ✅ **URL handler** (yt-dlp + trafilatura): TikTok video, IG Reel/photo, YT Shorts, Twitter, Pinterest, Reddit, Threads, articles — all branches working. Per-platform duration caps. TikTok `/photo/` rejection with @SaveAsBot pointer.
- ✅ **Source URL persistence**: flat keys in `enrichment` JSON; SOURCE footer in receipts; `↗ SOURCE` inline button; web UI surfacing on cards + detail page.
- ✅ **Video echo**: bot uploads downloaded mp4 to chat so user can re-watch.
- ✅ **SaveAsBot signature stripping**: `pipeline.clean_user_caption` applied everywhere.
- ✅ **Cost cuts**: Haiku 4.5 for vision (A/B confirmed); tightened duration caps. Worst-case URL ingest $0.06 → $0.018.
- ✅ **Docs set**: README, CHANGELOG, docs/ARCHITECTURE/API/SRS/DEPLOYMENT all written + pushed.
- ✅ **Bot ops learned**: kill-by-PID, Telegram `bot/close` API, never set webhook to a domain we don't own, never paste tokens in chat.

---

## What to build: magic URL + RLS

User lifecycle after Phase C:
1. New user opens `@supernuggetss_bot` → sends `/start`
2. Bot generates a `secrets.token_urlsafe(32)` token, upserts into `users` (telegram_id ↔ token)
3. Bot DMs the user `https://supernuggets-...vercel.app/u/<token>` plus a brief "this is your private vault, don't share" note
4. User taps the URL → frontend looks up `user_id` from the token → loads only that user's entries
5. Owner (admin) gets the same flow but the token they receive is the canonical one they bookmark
6. Entries' `OPEN` button in receipts uses `/u/<token>/?focus=<entry_id>`
7. Once magic URLs are out → enable RLS on `entries` so direct Supabase access can't bypass the token scope

### Phased rollout

| # | What | Where | Risk |
|---|---|---|---|
| **C-1** | Create `users` table in Supabase | SQL Editor (manual) | Low — additive |
| **C-2** | Bot generates token + DMs URL on `/start` | `database.py` + `bot.py` | Low — affects new users only |
| **C-3** | Frontend `/u/[token]` route resolves to user's entries | `app/u/[token]/page.tsx` + detail page | Medium — needs proper data scoping |
| **C-4** | Home `/` becomes a landing page (no data) | `app/page.tsx` rewrite | Low |
| **C-5** | Update bot's OPEN button URL to include token | `bot.py` `entry_keyboard` | Low |
| **C-6** | Fix edit/delete persistence (server actions actually write to Supabase) | `actions/` + each editor component | **Medium — investigate the bug first** |
| **C-7** | Enable RLS on `entries` + `users` | Supabase SQL Editor | **High — easy to lock yourself out if policies are wrong** |

**Recommend stopping after C-6 and validating end-to-end** (owner uses their magic URL, edits a folder, sees the change persist) before touching RLS. RLS is the irrevocable step.

### C-1 — `users` table schema

Run in Supabase SQL Editor:
```sql
create table public.users (
  id bigserial primary key,
  telegram_id bigint not null unique,
  token text not null unique,
  created_at timestamptz not null default now()
);
create index users_token_idx on public.users (token);
```
Then backfill the owner row so the existing entries are reachable:
```sql
-- Replace 445276 with ADMIN_ID if it ever changes.
insert into public.users (telegram_id, token)
values (445276, encode(gen_random_bytes(32), 'base64'));
-- Note the token returned — paste it into ~/supernuggets-bot/.env as
--   ADMIN_TOKEN=<value>
-- (optional, only needed if you want the bot to skip generating a new one for admin)
```

### C-2 — Bot side

`database.py` additions:
```python
import secrets

def ensure_user(telegram_id: int) -> str:
    """Upsert by telegram_id; return the user's token (creates if missing)."""
    # Try fetch first (cheap path for existing users).
    with httpx.Client() as c:
        r = c.get(
            _url("users"),
            params={"select": "token", "telegram_id": f"eq.{telegram_id}", "limit": "1"},
            headers=_HEADERS,
        )
        r.raise_for_status()
        rows = r.json()
        if rows:
            return rows[0]["token"]
        # Create.
        token = secrets.token_urlsafe(32)
        r = c.post(
            _url("users"),
            json={"telegram_id": telegram_id, "token": token},
            headers={**_HEADERS, "Prefer": "return=representation"},
        )
        r.raise_for_status()
        return r.json()[0]["token"]
```

`bot.py` — update `on_start`:
```python
@dp.message(CommandStart())
async def on_start(message: Message) -> None:
    if not message.from_user:
        return
    user_id = message.from_user.id
    token = await asyncio.to_thread(database.ensure_user, user_id)
    vault_url = f"{WEB_URL}/u/{token}" if WEB_URL.startswith("https://") else f"<deploy first>"
    await message.answer(
        "supernuggets v0.6\n"
        "--------------------\n"
        "Send anything — text, photo, video, link.\n"
        "I transcribe, summarize, fact-check, tag, file.\n\n"
        "YOUR PRIVATE VAULT\n"
        f"↗ {vault_url}\n"
        "[bookmark this — anyone with the URL sees your entries]\n\n"
        # ... existing limits + contact sections ...
    )
```

Add a `/myvault` command that re-DMs the URL anytime.

### C-3, C-4, C-5 — Frontend

**Move the home page under `/u/[token]/`:**
```
app/
  page.tsx              ← rewrite as landing (no data)
  u/
    [token]/
      page.tsx          ← copy of OLD app/page.tsx, scoped to one user
      n/
        [id]/
          page.tsx      ← move from app/n/[id]/page.tsx, scoped
```

Token → user_id lookup helper in `lib/users.ts`:
```ts
export async function userIdFromToken(token: string): Promise<number | null> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('token', token)
    .maybeSingle()
  return data?.id ?? null
}
```

In `app/u/[token]/page.tsx`:
```tsx
const userId = await userIdFromToken(params.token)
if (!userId) notFound()
const { data: rows } = await supabase
  .from('entries')
  .select('*')
  .eq('user_id', userId)            // ← was missing before
  .order('created_at', { ascending: false })
```

Same scoping for the detail page. Server actions (edit folder/tags/delete) take the token in the form payload and validate before writing.

**Home page rewrite (`app/page.tsx`):**
```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center font-mono">
      <pre>
{`supernuggets · personal second brain
------------------------------------
get your private vault via @supernuggetss_bot
send /start to receive your magic URL`}
      </pre>
    </main>
  )
}
```

**Bot OPEN button** (`bot.py` `entry_keyboard`) — fetch the token once per save call. Cleanest: pass it down from the handler that knows `user_id`. Cache for the bot process lifetime via a simple `{user_id: token}` dict — saves a DB roundtrip per receipt.

### C-6 — Edit/delete persistence bug

Currently the frontend's tag/folder/delete editors mutate local React state and may not call the Supabase mutation. Before scoping by token, **read each `actions/*.ts` file** and trace whether the corresponding component (`tag-editor.tsx`, `folder-editor.tsx`, `delete-button.tsx`) actually awaits the action. If not, wire it up.

Once fixed, every server action takes `token` as part of its form payload and verifies via `userIdFromToken` before mutating. Reject if mismatch.

### C-7 — RLS (do LAST, only after C-1 through C-6 are validated)

Policies (run in Supabase SQL Editor):
```sql
alter table public.entries enable row level security;
alter table public.users enable row level security;

-- Anon SELECT on entries: only if a matching users row exists with the
-- token presented via a request header `x-vault-token` (set by the frontend).
-- This requires the frontend to use a custom Supabase client that injects
-- the header, OR move all reads through server actions.
-- SIMPLER: keep reads on the server (server components) using the secret key,
-- and only enable RLS to prevent anon clients from reading. Frontend never
-- talks to entries directly post-RLS.
create policy entries_no_anon on public.entries
  for all to anon
  using (false);

-- (Same on users — they're never read from the browser.)
create policy users_no_anon on public.users
  for all to anon
  using (false);
```

**The simpler RLS model:** block anon entirely, route all reads through Next.js server components using the secret key. This works because Next.js servers can scope by `user_id` based on the URL's `token`. The anon key becomes inert — won't expose anything.

If you ever want browser-side reads (e.g., realtime subscriptions, client-rendered components), the policy needs to be smarter (e.g., JWT-based or RPC functions that take the token as a param). Defer until the use case appears.

---

## Open questions for the session

1. **Should `/start` regenerate the token if the user explicitly requests it (e.g., `/start regenerate`)?** Could be useful if a user accidentally shares their URL. v1 says no — keep it simple, revisit if needed.
2. **What about the existing OPEN buttons on old entries?** They point at `/?focus=<id>` (no token). After C-3, those URLs no longer work. Options:
   - (a) Live with the breakage — old buttons just open the landing page
   - (b) Regenerate `formatted_output` for all existing entries via a one-time SQL update
   - (c) Make the landing page detect `?focus=N` and prompt the user to message the bot for their URL
3. **Should the bot also offer a "give me a fresh URL" command?** `/myvault` is the bare minimum. Add `/regenerate` for security-conscious users? Defer.

---

## Env vars (`.env`)

Unchanged from current. After C-2, optionally add `ADMIN_TOKEN=...` if you want to skip the lookup for the admin user — but it's not necessary, the lookup is cheap.

Verify with:
```bash
cd ~/supernuggets-bot && awk -F= '/^[A-Z]/ { if (length($2) > 0) print "  " $1 "=<SET>"; else print "  " $1 "=<EMPTY>" }' .env
```

---

## Gotchas

- **Kill bot by PID, not `pkill -f`.** See CLAUDE.md.
- **NEVER touch `setWebhook` for evictions.** Use `bot/close` API.
- **NEVER paste tokens in chat.** Use `setup_env.sh` for secret rotation.
- **Supabase RLS gotcha**: server-side reads from the bot use the SECRET key which bypasses RLS. The anon-block policy only stops the browser. Verify this by hitting the REST API with the anon key after enabling RLS — should return empty.
- **Token format**: `secrets.token_urlsafe(32)` gives ~43 chars of URL-safe base64. Long enough that brute-force is infeasible, short enough that the magic URL fits in a Telegram message.
- **Owner's URL**: bookmark it. Once RLS is on, losing the token = losing access to your own vault until you re-DM `/start` (the bot will give you back the same token, the same vault).
- **Auto-deploy on push**: every `git push origin main` rebuilds Vercel. Test the C-4 home rewrite locally (`npm run dev`) before pushing.

---

## After multi-user: what's next

1. **Bot menus** (`/recent`, `/today`, `/folder`, `/search`) — paginated browse inside Telegram. Self-contained, ~1-2 hours.
2. **Weekly digest scheduler** — APScheduler hits owner with Sunday-evening summary.
3. **Deploy bot to Railway** — `docs/DEPLOYMENT.md` has the playbook.
4. **Native TikTok photo carousel support** (HIGH backlog) — Playwright build, 1-2 days.
5. **Magic URL hardening** — regenerate-token command, login-by-Telegram (if multi-device gets real).

User profile: non-technical. Explain steps before running. Confirm before destructive actions (especially the RLS step). Challenge their decisions when you disagree — they asked for this explicitly.
