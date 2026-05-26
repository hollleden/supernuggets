# supernuggets — Deployment

How to deploy, rotate secrets, and handle the common ops scenarios. Written for someone (the non-technical owner) who knows how to copy/paste but not how to debug a stuck Railway worker.

---

## 1. Hosting layout

| Component | Where it runs | How it gets there |
|---|---|---|
| Web frontend | Vercel | Auto-deploys on `git push origin main` to `hollleden/supernuggets` |
| Database | Supabase (managed) | Manual setup; runs as-is |
| Bot | Railway (planned) / local laptop (current) | Manual deploy from `~/supernuggets-bot/` |

---

## 2. Vercel — web frontend

### Current state
- ✅ Live at https://supernuggets-a3hhdfxc8-hollledens-projects.vercel.app
- ✅ GitHub repo: https://github.com/hollleden/supernuggets
- ✅ Auto-deploy on push to `main`

### Environment variables (Vercel project settings)
Already configured. If you ever rotate Supabase keys, update these:

| Key | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yncxcnfgiwdfnxkigodo.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon key from Supabase dashboard) | Public, browser-safe |
| `SUPABASE_SECRET_KEY` | (secret key from Supabase dashboard) | Server-only, used by server actions |

### Deploying a change
```bash
cd ~/supernuggets
git add -A
git commit -m "describe the change"
git push origin main
# Vercel picks up the push within ~30s and builds.
# Watch progress in Vercel dashboard or CLI: `vercel logs`.
```

### Rolling back a bad deploy
Vercel keeps every build. In the dashboard, find the previous successful build → "Promote to Production". Takes ~10 seconds.

---

## 3. Supabase — database

### Current state
- Project ID: `yncxcnfgiwdfnxkigodo`
- URL: `https://yncxcnfgiwdfnxkigodo.supabase.co`
- Tables: `entries`, `users` (reserved)
- RLS: disabled (single-user)

### Secret rotation (when needed)
1. Supabase dashboard → Project Settings → API → "Generate new secret key"
2. Copy the new `sb_secret_...` value
3. Update in `~/supernuggets-bot/.env`:
   ```
   SUPABASE_SECRET_KEY=sb_secret_<new>
   ```
4. Update in Vercel project env vars (same name)
5. Restart the bot; redeploy Vercel (or trigger a redeploy via dashboard)
6. Old key is revoked immediately

The anon key can also be rotated the same way but rarely needs it (it's intentionally public-safe).

### Schema migrations (manual, when needed)
Go to Supabase dashboard → SQL Editor. Apply changes there. Backup first by running:
```sql
SELECT * FROM entries;  -- copy result to a CSV via Export
```

---

## 4. Bot — local laptop (current)

### Running
```bash
cd ~/supernuggets-bot
.venv/bin/python bot.py
```
Polling loop runs until you `Ctrl+C`. The bot recovers cleanly if Telegram drops the connection.

### First-time setup
```bash
cd ~/supernuggets-bot
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
bash setup_env.sh          # interactive — prompts for each secret
```

### Required env vars (`.env`)
| Key | Where to get it | Notes |
|---|---|---|
| `BOT_TOKEN` | @BotFather → existing bot or `/newbot` | Never paste in chat. See §6.2 |
| `ADMIN_ID` | Your Telegram user_id (`@userinfobot` → forward yourself a message) | Admin bypasses quota |
| `SUPABASE_URL` | Supabase dashboard | `https://yncxcnfgiwdfnxkigodo.supabase.co` |
| `SUPABASE_SECRET_KEY` | Supabase dashboard → API → secret | starts with `sb_secret_` |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys | starts with `sk-ant-api03-` |
| `OPENAI_API_KEY` | platform.openai.com → API keys | needed for Whisper (video) |
| `WEB_URL` (optional) | your Vercel URL | `https://...vercel.app` |

### Stopping
`Ctrl+C` in the terminal. Or kill from another shell:
```bash
pkill -f "supernuggets-bot.*bot.py"
```

---

## 5. Bot — Railway (planned)

### Why Railway
- One-command deploy from `~/supernuggets-bot/`
- Free tier covers a polling worker (~$5/month after credits)
- `Procfile` already configured: `worker: python bot.py`

### First deploy (when ready)
```bash
cd ~/supernuggets-bot
railway login
railway init                  # create new project, link to this folder
railway up                    # deploy current code
railway variables set BOT_TOKEN=...   # set each secret
railway variables set ADMIN_ID=...
# ... (all env vars from §4)
railway logs                  # watch the polling loop
```

### Subsequent deploys
```bash
cd ~/supernuggets-bot
railway up
```
Or wire up GitHub auto-deploy by pushing the bot to a separate repo and connecting it in the Railway dashboard.

### Important: do NOT run the bot locally AND on Railway simultaneously
Telegram allows only one `getUpdates` poller per token at a time. Two pollers cause `TelegramConflictError`. Either:
- Stop the local bot before deploying to Railway
- Use Railway exclusively for prod, local only for dev (e.g. with a *separate* dev bot token from @BotFather)

---

## 6. Secret rotation playbook

### 6.1 Telegram bot token
**When:** if you accidentally paste the token in a chat / git commit / screenshot.

1. Telegram → `@BotFather` → `/revoke` → pick the bot
2. Copy the NEW token
3. **Don't paste it in a Claude chat or any LLM.** Update `.env` locally:
   ```bash
   cd ~/supernuggets-bot
   nano .env
   # change the BOT_TOKEN= line
   ```
4. If deployed on Railway: `railway variables set BOT_TOKEN=<new>`
5. Restart the bot

The OLD token is now dead. Any other poller using it stops working immediately.

### 6.2 Anthropic key
1. console.anthropic.com → API keys → create new
2. Update `.env` locally + Railway
3. Delete the old key from the Anthropic dashboard

### 6.3 OpenAI key
1. platform.openai.com → API keys → create new
2. Update `.env` locally + Railway
3. Revoke the old key

### 6.4 Supabase keys
See §3 above.

---

## 7. Troubleshooting

### Bot doesn't reply to anything
1. Check the bot is running: `ps aux | grep bot.py | grep -v grep`
2. Check logs for `TelegramConflictError` → another poller is active. `/revoke` token or shut down the other instance.
3. Check `.env` has all required keys: `cd ~/supernuggets-bot && grep -E "^(BOT_TOKEN|ANTHROPIC_API_KEY|OPENAI_API_KEY|SUPABASE)" .env | awk '{print $1, NF}'` — should show 4 keys all with values.
4. Check the bot connects to Telegram:
   ```bash
   cd ~/supernuggets-bot && .venv/bin/python -c "
   import os, httpx; from dotenv import load_dotenv; load_dotenv(override=True)
   print(httpx.get(f'https://api.telegram.org/bot{os.environ[\"BOT_TOKEN\"]}/getMe').json())
   "
   ```
   Should show `'ok': True`. If `'ok': False` with `Unauthorized`, the token is wrong/revoked.

### "Could not resolve authentication method" from Anthropic
Your shell has `ANTHROPIC_API_KEY=""` set empty, shadowing `.env`. Fix: `bot.py` already calls `load_dotenv(override=True)`. If you wrote a test script, do the same.

### "violated Telegram's Terms of Service" in clients
Some client-side display flag. `getMe` will still return ok. Best fix: `/revoke` the token to get a fresh one (same bot, new token), OR create a new bot via `/newbot`. **Do NOT use the `setWebhook` eviction trick — that's how a bot gets here in the first place** (see [CLAUDE.md Bot history](../CLAUDE.md#bot-history-which-token-is-live)).

### Receipts arrive but no `↗ SOURCE` button on URL entries
Check the URL stored in the entry: open it on the web detail page, look for the SOURCE block. If empty in DB → bot didn't get past `extract_url_info` (check bot logs). If populated in DB but missing from chat — `WEB_URL` or the source URL itself is not `https://` (Telegram drops non-https URL buttons silently).

### Whisper succeeds but transcript is empty
Whisper returns `""` for silent / music-only clips. Bot replies `[err] TRANSCRIPTION_FAILED — try a clearer audio track`. If you sent the URL form with a USER NOTE caption, that caption is still saved — but transcript-only videos won't ingest.

---

## 8. Cost monitoring

| Service | Dashboard | What to watch |
|---|---|---|
| Anthropic | console.anthropic.com → Usage | Per-day spend, cache hit rate |
| OpenAI | platform.openai.com → Usage | Whisper minutes |
| Supabase | dashboard → Project → Reports | DB size, request count |
| Vercel | dashboard → Project → Usage | Bandwidth (free tier covers personal traffic) |
| Railway (future) | dashboard → Project → Metrics | Worker uptime, network |

Hard caps in code (see [ARCHITECTURE.md §5.2](ARCHITECTURE.md#52-duration-caps-rationale)) prevent any single ingest from spiraling.

---

## 9. Backup

### Database
Supabase has automated daily backups for paid plans. For free tier:
- Manual export: dashboard → Database → Backups → "Create backup"
- Or via SQL: `SELECT * FROM entries` → export CSV

### Code
- Frontend: GitHub (`hollleden/supernuggets`)
- Bot: not yet on GitHub. Recommendation: `cd ~/supernuggets-bot && git init && gh repo create supernuggets-bot --private --source=. --remote=origin --push` to push it to a private repo before Railway deploy.

### Secrets
Best practice: store all `.env` values in a password manager (1Password, Bitwarden) as well. If your laptop dies, you can re-bootstrap from there in 5 minutes.
