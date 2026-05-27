# HANDOFF — Code review + bug investigation

**Active focus:** Review the production codebase for bugs and weak spots. Investigate two user-confirmed AI-output bugs (TikTok URL vs file inconsistency, plus AI-hallucination-on-sparse-transcript). The MENTIONED-should-be-empty rule is a quick prompt tweak that goes alongside. Magic-URL multi-user (Phase C) is **paused** mid-flight — see "Parked work" below.

**Read first:**

- [`CLAUDE.md`](CLAUDE.md) — full living state. **Phase C — PAUSED** section + **Known bugs to investigate** section are mandatory reading. They list three bugs and one already-shipped fix.
- [`HANDOFF-phase-c.md`](HANDOFF-phase-c.md) — the previous session's handoff covering the magic-URL work. Use when (and only when) we resume Phase C.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — data flow per ingest type, the `entries` row shape.
- [`docs/API.md`](docs/API.md) — Supabase schema. Note the `users` table now has unique constraints + token index (additive change made during Phase C C-1; harmless to current code).
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Railway + Vercel + Supabase ops.
- [`~/supernuggets-bot/pipeline.py`](../supernuggets-bot/pipeline.py) — AI prompts, Claude tool-use, yt-dlp/Whisper helpers, `build_video_url_input`, `clean_user_caption` + `_BOT_SIGNATURES`. **Both bug investigations live mostly here.**
- [`~/supernuggets-bot/bot.py`](../supernuggets-bot/bot.py) — handlers; `on_video` (file path) and `_handle_url` → `_ingest_url_video` (URL path) are the two code paths that diverge in the TikTok bug.
- [`~/supernuggets-bot/database.py`](../supernuggets-bot/database.py) — Supabase REST writes.

**Bot is on Railway.** No more local processes. `~/supernuggets-bot/` is a private GitHub repo (`hollleden/supernuggets-bot`) that auto-deploys to Railway on push to `main`. To deploy a fix: edit locally → commit → push → Railway picks it up in ~60s. Don't ever run `python bot.py` locally again unless you're debugging — it'll fight Railway's poller for Telegram's `getUpdates` slot.

---

## Parked work — Phase C magic URL

Previous session shipped Phase C through C-6 (TypeScript-clean, smoke-tested on localhost), then paused before deploy at user's request. Nothing reached production. **Do not resume without explicit user approval.**

| Where | State |
|---|---|
| `~/supernuggets/` branch `phase-c-magic-url` | All frontend Phase C changes committed. **Pushed to GitHub** (also on `origin/phase-c-magic-url`). `main` is back at the doc-update commit. |
| `~/supernuggets-bot/.phase-c-staging/` | Phase C `bot.py` + `database.py` stashed here (gitignored, won't ship to Railway). Source files in the repo are pre-Phase C. |
| Supabase `users` table | Has unique constraints + token index + a fresh 43-char urlsafe token for admin user 445276. Additive — no impact on current bot. |
| Vercel | Unchanged — still serving pre-Phase C code from `main`. |
| Bot v0.5 on Railway | OPEN button still points at `/?focus=<id>` (pre-Phase C behavior). |

**To resume Phase C**: `git checkout phase-c-magic-url` in `~/supernuggets/`, `cp ~/supernuggets-bot/.phase-c-staging/{bot,database}.py ~/supernuggets-bot/`, commit + push the bot (Railway auto-deploys), then follow `HANDOFF-phase-c.md` from the "VALIDATE end-to-end" step onward.

---

## What to do this session

### 1. Code review (primary)

Fresh independent pass over `~/supernuggets-bot/{bot,pipeline,database}.py` and `~/supernuggets/{app,components,lib}/` looking for:

- **Correctness bugs** — race conditions, off-by-one, missing error handling, swallowed exceptions, leaked exceptions to users.
- **Security / privacy** — anything that could leak user_id 445276's entries (still single-user, but consider the multi-user shape coming in Phase C). Make sure no client-side code logs tokens / secrets / raw bot responses.
- **Cost** — any path that re-calls Claude or Whisper redundantly. The `pipeline.process_text` and `pipeline.process_images` paths are the expensive ones.
- **Robustness** — what happens if Supabase is down? If Anthropic times out? If Whisper rejects the file? Most of the right answers already exist (the bot reports `[err]` and the receipt isn't sent), but spot-check the gaps.
- **Telegram API gotchas** — see CLAUDE.md "Telegram API safety" and "Gotchas you'd otherwise re-discover" before doing anything that touches `setWebhook` / message entities / inline buttons.
- **Naming and clarity** — places where a future reader will get lost. Don't churn for the sake of it; flag the worst offenders.

Deliver: a short prioritized list (P0/P1/P2) of issues + a recommendation for each. **Do not start refactoring** unless the user explicitly approves a finding.

### 2. The three known bugs (CLAUDE.md → "Known bugs to investigate")

**All three are real, all three are MEDIUM severity, none are blockers.** Brief recap:

- **TikTok URL vs file inconsistency** — same TikTok video sent as a file vs. URL produces materially different AI outputs (different MENTIONED in particular). Hypothesis: the URL-path `SOURCE: TikTok · @uploader` framing in `pipeline.build_video_url_input` biases the model.
- **AI hallucinates on sparse Whisper transcripts** — promo videos with near-empty audio get receipts with invented titles and content. E.g. an 8-step skincare montage became `[CURATION] KISSES OF THE SUN` with poetic interpretation. Re-sending the same video produces *different* hallucinations.
- **MENTIONED should be empty when there's nothing real** — mirror the existing "FACT-CHECK leave empty if nothing to verify" rule. Currently MENTIONED gets stuffed with whatever the AI can scrape (bot handles, generic categories). Likely a 1-line tweak in the system prompt + tool schema description.

**Approach** — investigate the system prompt + tool schema in `pipeline.py` (look for `MODEL_TEXT_SYSTEM` / `MODEL_VISION_SYSTEM` / `save_nugget` tool definition). All three may share root causes in how the prompt frames the task. Propose fixes; don't ship without user approval of the approach.

### 3. Already shipped (do not re-do)

- **2026-05-27** — Extended `_BOT_SIGNATURES` to catch the Russian "Спасибо, что пользуетесь — @SaveAsBot'ом" variant. 8 unit-tested cases pass. Already on Railway (commit `7b9a2cb`). If the user reports the bot STILL putting "SaveAsBot" in MENTIONED for a forwarded SaveAsBot video, that's a NEW report worth investigating (could be a different signature variant, or could be the broader "AI fills MENTIONED with anything" problem).

### 4. (If time) other items from backlog

See CLAUDE.md "Backlog" — duplicate detection (medium priority, would prevent re-processing the same TikTok twice and incidentally make the URL/file bug less visible) is a natural follow-on.

---

## Working norms with this user

- **Non-technical user.** Explain in plain language. Confirm before destructive actions.
- **Challenge their decisions** when you disagree. They asked for this explicitly.
- **Bot is on Railway now.** Pushing to `hollleden/supernuggets-bot` main triggers an auto-deploy. So even a small commit DEPLOYS — be intentional about what you push. No "test in production" mindset.
- **Don't push frontend to Vercel** without explicit go-ahead. Same reasoning.
- **No bot output format iteration** unless we hit a real render bug — spec is locked in CLAUDE.md.
- **Never paste tokens / secret keys in chat** — see CLAUDE.md security to-dos.

---

## State of the world at handoff (2026-05-27 ~09:55 utc)

- **Bot** runs on Railway (project `b86e3cf7-fa1f-4c7b-a788-b420634743c0`, service named `supernuggets`). Source: `hollleden/supernuggets-bot` main. Latest commit on Railway: `7b9a2cb` (SaveAsBot regex extension).
- **No local bot processes.** Past zombie (PID 56441) was killed; lsof reports no Telegram connections from this laptop.
- **Frontend** on Vercel: https://supernuggets-a3hhdfxc8-hollledens-projects.vercel.app (pre-Phase C `main` + doc-update commit).
- **Supabase**: `entries` unchanged. `users` has additive constraints + index; one row for admin user 445276 with a 43-char token. RLS still OFF.
- **Bot Railway env vars**: `BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ADMIN_ID`, `WEB_URL` (= the Vercel URL).
- **Two GitHub repos** under `hollleden`: `supernuggets` (frontend, public), `supernuggets-bot` (bot, private). Both have `main` deployed.
