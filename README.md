# supernuggets

A personal "second brain" — anything you send to a Telegram bot becomes an AI-summarized, fact-checked, tagged, file-cabineted nugget in a Pinterest-style web vault.

> "I'm thirty-three. Trust me — I will forget that wine bar. You won't."

---

## What it does

You send the bot **anything**:

| Send | What happens |
|---|---|
| Text message | Claude Haiku classifies + tags + summarises → saved |
| Single photo | Claude Sonnet vision extracts text + objects + claims → saved |
| Photo album (up to 10) | One vision call, one combined nugget |
| Video clip | Whisper transcribes → text pipeline → saved |
| TikTok / Instagram Reel / YouTube Shorts / Twitter video / Pinterest / Reddit / Threads URL | yt-dlp downloads → Whisper or vision → saved |
| Instagram photo carousel URL | yt-dlp downloads images → vision → saved |
| Article URL (Substack, Medium, news…) | trafilatura extracts main text → text pipeline → saved |

Each saved nugget lands in **one of 12 folders** (Grow · Leisure · Health · Creativity · Money · Work · Curation · Personal · Beauty · Food · Travel · Sport), gets 3-5 hashtags, a 2-3 bullet summary, a fact-check pass on verifiable claims, and a `↗ SOURCE` link back to the original.

You browse the result at **[supernuggets-a3hhdfxc8-hollledens-projects.vercel.app](https://supernuggets-a3hhdfxc8-hollledens-projects.vercel.app)** — Pinterest-style grid, filter by folder, search by tag, click into the detail view.

---

## Architecture at a glance

```
┌───────────────┐    ┌───────────────┐    ┌──────────────┐
│ Telegram bot  │───▶│ AI pipeline   │───▶│  Supabase    │
│ (Python,      │    │ (Claude tool  │    │ (Postgres)   │
│  aiogram v3)  │    │  use, Whisper,│    │              │
│               │    │  yt-dlp,      │    │              │
│               │    │  trafilatura) │    │              │
└───────────────┘    └───────────────┘    └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │   Web UI     │
                                          │ (Next.js 16, │
                                          │  Tailwind v4,│
                                          │  shadcn/ui)  │
                                          └──────────────┘
```

Two codebases:
- [`~/supernuggets-bot/`](.) — Python bot (this folder is the **frontend repo**; the bot folder lives separately on disk and is the source of truth for the Telegram ingestion logic)
- [`~/supernuggets/`](.) — Next.js frontend (you're looking at it)

Detailed system design lives in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Quickstart (local dev)

### Frontend (this repo)
```bash
cd ~/supernuggets
npm install
cp .env.example .env.local  # then fill in Supabase keys
npm run dev                 # → http://localhost:3000
```

### Bot
```bash
cd ~/supernuggets-bot
python -m venv .venv
.venv/bin/pip install -r requirements.txt
bash setup_env.sh           # interactive prompt for secrets
.venv/bin/python bot.py     # → polling loop
```

Full setup including secret rotation: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Stack

| Layer | Pick | Why |
|---|---|---|
| Web framework | Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui | Modern React server components; matches v0.dev generation output |
| Database | Supabase (Postgres) | Shared between bot + web; REST API; row-level security ready |
| Bot framework | aiogram v3 (Python) | First-class async; clean handler/filter API |
| AI — text | Claude Haiku 4.5 | ~70% cheaper than Sonnet for structured classification |
| AI — vision | Claude Sonnet 4.6 | Vision quality still wants the bigger model |
| Transcription | OpenAI Whisper | $0.006/min, accepts mp4 directly |
| Media downloader | yt-dlp | TikTok / IG / YouTube / Twitter / Pinterest / Reddit / Threads |
| Article extractor | trafilatura | Mature, low-maintenance; honest about paywalls |
| Image processing | Pillow | Resize to 1568px, JPEG q=85, strip EXIF |
| Bot hosting | Railway (planned) | Procfile-based; one-command deploy |
| Frontend hosting | Vercel | Auto-deploy on `git push` |

---

## Folder taxonomy

Single source of truth — 12 folders, never more, never fewer:

```
Grow 🌱  ·  Leisure 🎉  ·  Health 💚  ·  Creativity 🎨
Money 💰  ·  Work 💼  ·  Curation 🗂  ·  Personal 💫
Beauty 💄  ·  Food 🍽  ·  Travel ✈️  ·  Sport 🏃
```

Enforced at the bot (Claude system prompt constrains output to this enum). Defined in two places that must stay in sync:
- Frontend: [`lib/nuggets.ts`](lib/nuggets.ts) (`FolderType`, `FOLDERS`, `FOLDER_COLOR_HEX`)
- Bot: `pipeline.py` (`FOLDERS`)

---

## Cost per nugget (rough)

| Input | Cost per ingest |
|---|---|
| Text message | ~$0.001 |
| Single image | ~$0.005 |
| Image album (8) | ~$0.03 |
| 1-min video | $0.006 (Whisper) + ~$0.001 (Haiku) = $0.007 |
| 10-min video (max) | ~$0.07 |
| Article (1k words) | ~$0.002 |

Hard caps protect against runaway costs — per-platform duration limits enforce ~10-min worst-case Whisper spend.

---

## What's where (docs)

| File | What's in it |
|---|---|
| [`README.md`](README.md) | You are here |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, data flow, key decisions |
| [`docs/API.md`](docs/API.md) | Module/function reference + Supabase schema |
| [`docs/SRS.md`](docs/SRS.md) | Formal Software Requirements Specification |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Railway + Vercel + secrets rotation |
| [`CHANGELOG.md`](CHANGELOG.md) | Versioned history of what shipped when |
| [`BRAND.md`](BRAND.md) | Visual identity, locked bot-copy spec |
| [`CLAUDE.md`](CLAUDE.md) | Living memory for the AI assistant building this |
| [`HANDOFF.md`](HANDOFF.md) | Session-to-session handoff notes |
| [`RUN-LOCALLY.md`](RUN-LOCALLY.md) | Web-app local-dev quirks |

---

## Status

| Component | Status |
|---|---|
| Web frontend | ✅ live · auto-deploys on push |
| Bot — text/image/video/URL/article ingestion | ✅ feature-complete |
| Bot — menus (`/recent`, `/today`, `/folder`) | ⏳ planned |
| Bot — weekly digest scheduler | ⏳ planned |
| Bot — Railway deploy | ⏳ planned |
| Multi-user (RLS + magic URL) | ⏳ Phase C |
| Native TikTok photo carousels | 🚧 backlog (HIGH) |

---

## License

Personal project — no open-source license declared.
