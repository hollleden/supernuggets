# HANDOFF — Code review + bug investigation

**Active focus:** Review the production codebase for bugs and weak spots. Then investigate one user-confirmed inconsistency in how the bot processes TikTok content depending on whether the source is a video file or a URL. Magic-URL multi-user (Phase C) is **paused** mid-flight — see "Parked work" below.

**Read first:**

- [`CLAUDE.md`](CLAUDE.md) — full living state. The **Phase C** section and the new **Known bugs to investigate** section are mandatory reading.
- [`HANDOFF-phase-c.md`](HANDOFF-phase-c.md) — the previous session's handoff covering the magic-URL work. Use when (and only when) we resume Phase C.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — data flow per ingest type, the `entries` row shape.
- [`docs/API.md`](docs/API.md) — Supabase schema. Note the `users` table now has unique constraints + token index (additive change made during Phase C C-1; still harmless to current code).
- [`~/supernuggets-bot/pipeline.py`](../supernuggets-bot/pipeline.py) — AI prompts, Claude tool-use, yt-dlp/Whisper helpers, `build_video_url_input`, `clean_user_caption`. **Both code review and the TikTok bug live mostly here.**
- [`~/supernuggets-bot/bot.py`](../supernuggets-bot/bot.py) — handlers; `on_video` (file path) and `_handle_url` → `_ingest_url_video` (URL path) are the two code paths that diverge in the bug.
- [`~/supernuggets-bot/database.py`](../supernuggets-bot/database.py) — Supabase REST writes.

**Run the bot locally:** `cd ~/supernuggets-bot && .venv/bin/python bot.py`

**Bot is currently running** in the background (PID 56441 as of 2026-05-26 16:29 utc), reverted to v0.5 (pre-Phase C). Log: `/tmp/supernuggets-bot.log`. **Kill reliably:** `kill -9 $(ps -ef | grep "bot.py" | grep -v grep | awk '$NF=="bot.py" {print $2}')` — never `pkill -f`. See CLAUDE.md "Killing the bot reliably" for why.

---

## Parked work — Phase C magic URL

Earlier session shipped Phase C through C-6 (TypeScript-clean, smoke-tested on localhost), then paused before deploy at user's request. Nothing reached production.

| Where | State |
|---|---|
| `~/supernuggets/` branch `phase-c-magic-url` | All frontend Phase C changes committed locally. Not pushed. `main` is back at `433fb19`. |
| `~/supernuggets-bot/.phase-c-staging/` | Phase C `bot.py` + `database.py` stashed here. Source files are reverted. |
| Supabase `users` table | Has unique constraints + token index + a fresh 43-char urlsafe token for admin user 445276. Additive — no impact on current bot. |
| Vercel | Unchanged — still serving pre-Phase C code from `main`. |
| Bot v0.5 currently runs in prod | OPEN button still points at `/?focus=<id>` (pre-Phase C behavior). |

**To resume Phase C** (when ready): `git checkout phase-c-magic-url` in `~/supernuggets/`, `cp ~/supernuggets-bot/.phase-c-staging/{bot,database}.py ~/supernuggets-bot/`, restart bot, then follow `HANDOFF-phase-c.md` from the "VALIDATE end-to-end" step onward.

---

## What to do this session

### 1. Code review (primary)

Goal: a fresh independent pass over `~/supernuggets-bot/{bot,pipeline,database}.py` and `~/supernuggets/{app,components,lib}/` looking for:

- **Correctness bugs** — race conditions, off-by-one, missing error handling, swallowed exceptions, leaked exceptions to users.
- **Security / privacy** — anything that could leak user_id 445276's entries (still single-user, but consider the multi-user shape coming in Phase C). Make sure no client-side code logs tokens / secrets / raw bot responses.
- **Cost** — any path that re-calls Claude or Whisper redundantly. The `pipeline.process_text` and `pipeline.process_images` paths are the expensive ones.
- **Robustness** — what happens if Supabase is down? If Anthropic times out? If Whisper rejects the file? Most of the right answers already exist (the bot reports `[err]` and the receipt isn't sent), but spot-check the gaps.
- **Telegram API gotchas** — see CLAUDE.md "Telegram API safety" and "Gotchas you'd otherwise re-discover" before doing anything that touches `setWebhook` / message entities / inline buttons.
- **Naming and clarity** — places where a future reader will get lost. Don't churn for the sake of it; flag the worst offenders.

Deliver: a short prioritized list (P0/P1/P2) of issues + a recommendation for each. **Do not start refactoring** unless the user explicitly approves a finding.

### 2. TikTok URL vs. file inconsistency (the one bug user wants confirmed)

User-reported. Send the same TikTok video as (a) a video file attachment and (b) the TikTok URL — the bot's receipts differ in `title`, `MENTIONED`, `FACT-CHECK`, and `tags` even though the underlying transcript is essentially identical.

**Concrete example from the user's chat (2026-05-26)**:

- **File path** (`on_video` → `pipeline.process_text(transcript)`) — title `[PERSONAL] LYOCELL VS VISCOSE: CHOOSING SUSTAINABLE FABRICS`, MENTIONED: Lyocell / Viscose / Modal, 3 fact-checks, 6 tags including `#sustainable_fabric #activewear #textile_production`.
- **URL path** (`_handle_url` → `pipeline.build_video_url_input` → `pipeline.process_text(ai_input, source)`) — no `[FOLDER]` title prefix visible in the user's paste, MENTIONED: just "Han Chen Xu" (the uploader), 2 fact-checks, 6 tags including `#rayon_alternatives #viscose_impact #workout_apparel`.

**Hypothesis** (worth testing): `pipeline.build_video_url_input` prepends `SOURCE: TikTok · @hanchen_xu · 1:34` and `TITLE: ...` and `DESCRIPTION: ...` to the AI input. The model uses this as primary framing and pushes the uploader into MENTIONED while pushing topic entities out. The file path has no such framing, so the model defaults to topic entities.

**Where to look**:
- `pipeline.build_video_url_input` (formats the URL-path AI input)
- `pipeline.process_text` signature — note the URL path passes a `source` kwarg, the file path doesn't
- The system prompt + tool schema in `pipeline.py` — does the prompt say anything about prioritizing entities vs. creators in MENTIONED?
- Run a quick A/B: feed the same transcript through both paths (you can write a tiny harness or call `process_text` directly in `python -c`).

**Likely fix paths** (don't ship without discussing):
- (a) Strip the SOURCE/TITLE/DESCRIPTION block out of the AI input on the URL path — they're useful for storage but maybe biasing the model. Source URL is already stored in `enrichment` separately.
- (b) Update the system prompt to say "MENTIONED is for entities, products, brands, people *mentioned within* the content — NOT the creator or platform."
- (c) Detect URL/source automatically in `process_text` and inject a stronger "ignore source metadata for MENTIONED" hint.

**Not a blocker** — the user can live with the inconsistency. But it's the right next bug to land.

### 3. (If time) other items from backlog

See CLAUDE.md "Backlog" — duplicate detection (medium priority, would prevent re-processing the same TikTok twice and incidentally make the URL/file bug less visible) is a natural follow-on.

---

## Working norms with this user

- **Non-technical user.** Explain in plain language. Confirm before destructive actions.
- **Challenge their decisions** when you disagree. They asked for this explicitly.
- **Don't push to git / deploy to Vercel** without an explicit go-ahead. The current session paused before push for a reason.
- **No bot output format iteration** unless we hit a real render bug — spec is locked in CLAUDE.md.
- **Never paste tokens / secret keys in chat** — see CLAUDE.md security to-dos.

---

## State of the world at handoff (2026-05-26 16:30 utc)

- **Bot** running locally, v0.5, PID 56441 (kill with `kill -9 56441` or the pattern above)
- **Frontend** on Vercel: https://supernuggets-a3hhdfxc8-hollledens-projects.vercel.app (pre-Phase C `main`)
- **Supabase**: `entries` unchanged. `users` has additive constraints + index; one row for admin user 445276 with a 43-char token. RLS still off.
- **Bot `.env`**: contains `WEB_URL=https://supernuggets-a3hhdfxc8-hollledens-projects.vercel.app` (added during Phase C; harmless to the v0.5 bot which uses it for the `?focus=` URL).
- **Dev server**: not running.
