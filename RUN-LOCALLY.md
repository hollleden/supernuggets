# How to run supernuggets locally

Two things to start, in two separate Terminal windows. Order doesn't matter — they're independent.

---

## 1. Start the bot (Telegram)

Open Terminal. Run:

```
cd ~/supernuggets-bot && .venv/bin/python bot.py
```

You should see logs like:

```
... · INFO · starting polling loop · admin_id=445276 · daily_limit=5
```

Now open Telegram, find `@supernuggets_bot`, and send it anything (text, photo, album).

**To stop:** click the Terminal window and press `Ctrl+C`.

---

## 2. Start the web frontend

Open a **new** Terminal window (Cmd+N inside Terminal). Run:

```
cd ~/supernuggets && npm run dev
```

You should see:

```
✓ Ready in ...ms
- Local:   http://localhost:3000
```

Now open [http://localhost:3000](http://localhost:3000) in your browser. Your saved entries appear in the grid.

**To stop:** click the Terminal window and press `Ctrl+C`.

---

## Common issues

**"BOT_TOKEN missing in .env"**
→ The bot's `.env` file is missing or empty. Check `~/supernuggets-bot/.env` exists. If you ever need to recreate it: `cd ~/supernuggets-bot && bash setup_env.sh`.

**"Port 3000 is already in use"**
→ Another `npm run dev` is still running somewhere. Either find that Terminal and `Ctrl+C` it, or run the next instance on a different port: `npm run dev -- --port 3001`.

**Bot replies but says "❌ ai pipeline failed"**
→ Anthropic API key is wrong or out of credit. Check `~/supernuggets-bot/.env` and the Anthropic console.

**Bot says "⚠️ saved nothing — db error"**
→ Supabase key is wrong or rotated. Current key starts with `sb_secret_MnzWU...`. Check `~/supernuggets-bot/.env`.

**Web shows "Failed to fetch" or blank grid**
→ Either the dev server isn't running (`npm run dev`), or `~/supernuggets/.env.local` is missing the Supabase keys.

**No OPEN button under bot messages**
→ Expected while running locally. Telegram rejects `http://localhost:*` URLs in inline buttons, so the bot hides OPEN until the web frontend is deployed to a real `https://` URL.

---

## Daily quick-reference

| Goal | Command |
|---|---|
| Start bot | `cd ~/supernuggets-bot && .venv/bin/python bot.py` |
| Start web | `cd ~/supernuggets && npm run dev` |
| Stop either | `Ctrl+C` in that Terminal window |
| Open web | http://localhost:3000 |
| Find bot | `@supernuggets_bot` in Telegram |
