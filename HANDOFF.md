# HANDOFF — Phase B remainder: bot menus (`/recent`, `/today`, `/folder`, `/search`)

**Context:** Ingestion pipeline is **feature-complete** — text, photos, video, video URL (TikTok / IG Reels / YT Shorts / Twitter / Pinterest / Reddit / Threads), photo carousels, and articles all ingest end-to-end with the SOURCE footer + button. Whisper transcription, OCR-forced vision, source URL persistence, video echo, SaveAsBot signature stripping, cost-cut to ~$3-4/mo (Haiku for vision + tightened caps) — all shipped. This next session picks up with **bot menus** — letting the user browse and filter their vault directly from Telegram without opening the web UI.

**Read first:**
- [`CLAUDE.md`](CLAUDE.md) — full living state. The "URL handler reference" + "Bot history" + "Telegram API safety" sections are mandatory reading before touching the bot.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, data flow per ingest type, decisions log.
- [`docs/API.md`](docs/API.md) — Supabase schema + module reference (you'll need this for the new query functions).
- [`~/supernuggets-bot/bot.py`](../supernuggets-bot/bot.py) — every existing handler. The new menu commands go alongside them.
- [`~/supernuggets-bot/database.py`](../supernuggets-bot/database.py) — currently has `get_today_count`, `save_entry`, `delete_entry`. You'll add list/query functions.
- TeleForge patterns reference (don't fork, just steal): https://github.com/zerox9dev/TeleForge — clean inline-keyboard pagination for browsing.

**Run the bot locally to test:** `cd ~/supernuggets-bot && .venv/bin/python bot.py`

**Kill bot reliably:** `kill -9 $(ps -ef | grep "bot.py" | grep -v grep | awk '$NF=="bot.py" {print $2}')` — **NOT** `pkill -f`. See CLAUDE.md "Killing the bot reliably" for why.

---

## What's done (this session, 2026-05-26)

- ✅ **URL handler** — yt-dlp branch (TikTok video, IG Reel/photo, YT Shorts, Twitter, Pinterest, Reddit, Threads) + trafilatura article fallback. Per-platform duration caps. TikTok `/photo/` URLs rejected with @SaveAsBot pointer.
- ✅ **Source URL surfacing** — stored as flat keys in `enrichment` JSON; SOURCE footer in receipts (after TAGS); `↗ SOURCE` inline button on URL-derived entries; web UI shows source on cards + detail pages.
- ✅ **Video echo** — `_ingest_url_video` uploads the downloaded mp4 to chat via `bot.send_video` so the user can re-watch from history.
- ✅ **SaveAsBot signature stripping** — `pipeline.clean_user_caption` applied at every caption-read site.
- ✅ **Cost cuts** — Haiku 4.5 for vision (A/B confirmed quality holds); tightened `URL_DURATION_CAPS` (TikTok 180s, IG 90s, default 180s). Worst-case URL ingest: $0.018 → $0.06 reduced to $0.018. Per-album: $0.03 → $0.005.
- ✅ **Docs set** — README, CHANGELOG, docs/ARCHITECTURE, docs/API, docs/SRS, docs/DEPLOYMENT all written and pushed.
- ✅ **Bot ops learned** — kill-by-PID, `/close` API for session release, never set webhook to a domain we don't own. All baked into CLAUDE.md.
- ✅ **Token rotation playbook** — `setup_env.sh` rewritten to keep current values on blank input (one-key rotation without re-pasting everything); `fix_env.py` companion to repair `.env` corruption from the v1 bug.

---

## What to build: bot menus

**User flow:** user types `/recent` (or `/today`, `/folder Beauty`, `/search korean`) in chat → bot replies with a paginated list of nuggets matching the query → tap an entry's title → opens the web detail page → tap `← BACK` (callback) to return to the list → tap `← NEXT 10 →` to paginate.

### Commands to implement

| Command | Behavior |
|---|---|
| `/recent` | Last 10 entries, newest first, paginated |
| `/today` | Entries created today (UTC), paginated |
| `/folder <name>` | Entries in that folder (e.g. `/folder Beauty`). If name omitted → show folder picker keyboard with the 12 folders |
| `/search <query>` | Substring search across title + tags + raw_content. Paginated |

### Receipt format for list views

One Telegram message per page, ~10 entries each. Single block, monospaced:

```
[RECENT · PAGE 1/3]
--------------------
1 · [BEAUTY] BARCELONA WINE BARS GUIDE
    05/24 · #wine_bars #travel
2 · [HEALTH] CICAPLAST FOR SEBACEOUS FILAMENTS
    05/24 · #skincare #korean_beauty
3 · [GROW] Y COMBINATOR OPEN-SOURCES GSTACK
    05/26 · #ai_agents #startup
...
--------------------
TOTAL: 27 entries · showing 1-10
```

Inline keyboard under each page: `[← PREV] [PAGE 1/3] [NEXT →]` (PREV hidden on page 1, NEXT hidden on last page). Each entry's title is a `tg://` deep link OR a button — TBD during implementation (see "Open question" below).

### Implementation plan (in order)

#### 1. Add query functions to `database.py`

```python
def get_entries(
    user_id: int,
    *,
    folder: str | None = None,
    today_only: bool = False,
    search: str | None = None,
    limit: int = 10,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """Returns (rows, total_count). Filters compose."""
    params = {
        "select": "id,created_at,folder,title,tags",
        "user_id": f"eq.{user_id}",
        "order": "created_at.desc,id.desc",
        "limit": str(limit),
        "offset": str(offset),
    }
    if folder:
        params["folder"] = f"eq.{folder}"
    if today_only:
        params["created_at"] = f"eq.{_today_utc()}"
    if search:
        # Postgres `or` filter syntax. Substring on title + raw_content.
        q = search.replace(",", " ").strip()
        params["or"] = f"(title.ilike.*{q}*,raw_content.ilike.*{q}*,tags.ilike.*{q}*)"
    headers = {**_HEADERS, "Prefer": "count=exact"}
    with httpx.Client() as c:
        r = c.get(_url("entries"), params=params, headers=headers)
        if r.status_code >= 400:
            raise RuntimeError(f"supabase {r.status_code}: {r.text}")
        cr = r.headers.get("content-range", "*/0")
        total = int(cr.rsplit("/", 1)[-1]) if "/" in cr else 0
        return r.json(), total
```

This single function with optional filters covers all four commands. Keeps the surface small.

#### 2. Add command handlers to `bot.py`

Pattern: each command calls a shared `_send_list_page` helper. Pagination state lives in `callback_data` (e.g. `list:recent:0`, `list:folder:Beauty:10`), so no server-side state to track.

Skeleton:
```python
from aiogram.filters import Command

PAGE_SIZE = 10

@dp.message(Command("recent"))
async def on_recent(message: Message) -> None:
    if not message.from_user: return
    await _send_list_page(message, kind="recent", page=0, user_id=message.from_user.id)

@dp.message(Command("today"))
async def on_today(message: Message) -> None:
    if not message.from_user: return
    await _send_list_page(message, kind="today", page=0, user_id=message.from_user.id)

@dp.message(Command("folder"))
async def on_folder(message: Message) -> None:
    if not message.from_user: return
    # /folder Beauty → filter; /folder alone → show picker
    args = (message.text or "").split(maxsplit=1)
    folder_arg = args[1].strip() if len(args) > 1 else None
    if folder_arg:
        await _send_list_page(message, kind="folder", page=0, user_id=message.from_user.id, folder=folder_arg)
    else:
        await message.answer("[FOLDER] pick one:", reply_markup=_folder_picker_keyboard())

@dp.message(Command("search"))
async def on_search(message: Message) -> None:
    if not message.from_user: return
    args = (message.text or "").split(maxsplit=1)
    if len(args) < 2:
        await message.answer("[search] usage: /search <query>")
        return
    await _send_list_page(message, kind="search", page=0, user_id=message.from_user.id, query=args[1])
```

`_send_list_page` queries `database.get_entries`, renders the monospaced list block, attaches the pagination keyboard, and either sends as a new message OR edits the existing one (when called from a pagination callback). Use `message.answer` for new, `callback.message.edit_text` for paginate.

#### 3. Pagination callback handler

```python
@dp.callback_query(F.data.startswith("list:"))
async def on_list_paginate(callback: CallbackQuery) -> None:
    # callback.data shape: list:<kind>:<page>[:<arg>]
    # e.g. list:recent:1, list:folder:Beauty:2, list:search:korean:0
    ...
```

#### 4. Folder picker keyboard

Inline keyboard with the 12 folders (3 cols × 4 rows). Each button's `callback_data` is `list:folder:Grow:0` etc. Tapping = jumps into that folder's list.

#### 5. Update `/start` help text

Add the four new commands to the `on_start` reply in bot.py.

#### 6. Test scenarios

- `/recent` → see 10 most recent, pagination works
- `/today` when 0 today → "no entries today" message
- `/folder Beauty` → filtered list
- `/folder` (no arg) → picker → tap Beauty → filtered list
- `/search korean` → matches title/tags/raw_content
- `/search` (no arg) → usage message
- Pagination NEXT on last page → graceful (hide button)

---

## Open question for the next session

**How does tapping a list entry open its detail?** Two options:

| Option | UX | Pros | Cons |
|---|---|---|---|
| **A — Numbered list, no per-entry buttons** | User reads list, opens web UI manually for full detail | Clean, 10-entry pages stay short | Extra friction; user has to know URL |
| **B — Per-entry inline button** | Each entry has a `[OPEN]` button → links to web detail page | One tap to open | More vertical space; only 5-6 entries per message before keyboard gets crowded |

Recommend Option A for v1 — keeps the format spartan. We can add buttons later if it turns out clicking-through is the actual use case.

---

## Env vars (`.env`)

Unchanged from current — no new keys needed for menus. Confirm with:
```bash
cd ~/supernuggets-bot && awk -F= '/^[A-Z]/ { if (length($2) > 0) print "  " $1 "=<SET>"; else print "  " $1 "=<EMPTY>" }' .env
```

Should show all of: `BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ADMIN_ID`, `CLAUDE_MODEL_VISION`.

---

## Gotchas to remember

- **Kill bot by PID, not `pkill -f`.** Multiple zombie bot.py processes from earlier sessions caused every "phantom polling" bug we hit. See CLAUDE.md "Killing the bot reliably".
- **NEVER touch `setWebhook`.** Use `bot/close` API to release session state. The webhook eviction trick is what got @supernuggets_bot display-banned.
- **NEVER paste tokens in chat.** Use `setup_env.sh` for any secret rotation. The script keeps current values on blank input.
- **Telegram HTML escape** — use `html.escape(s, quote=False)`, never `quote=True`. Numeric entities like `&#x27;` break Telegram parsing.
- **`load_dotenv(override=True)`** — already in `bot.py`. Don't remove it.
- **Supabase REST `or` filter syntax** is unusual (`or=(col.op.val,col.op.val)`); confirm via the Supabase docs page before debugging.

---

## After menus: what's next

1. **Weekly digest scheduler** — APScheduler hits the user with a Sunday-evening summary of the week's nuggets. Cron-style trigger inside the bot process.
2. **Deploy bot to Railway** — Procfile already exists; just need to wire env vars in the Railway dashboard. See `docs/DEPLOYMENT.md` for the playbook.
3. **TikTok photo carousel native support** (HIGH backlog) — biggest missing feature. Four implementation paths documented in CLAUDE.md backlog; recommend Playwright as the first attempt.
4. **Magic URL multi-user** (Phase C) — `supernuggets.app/u/<token>` per-user vaults, RLS, fix frontend persistence bug.

User profile: non-technical. Explain steps before running. Confirm before destructive actions. They asked for this explicitly: "Challenge their decisions when you disagree."
