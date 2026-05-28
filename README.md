# supernuggets

## About supernuggets

supernuggets is a personal knowledge capture tool. It pairs a Telegram bot with a web app, so anything worth remembering — a recipe a friend rattled off, a skincare routine you saw on TikTok, a product name you spotted on a label, a long article you swear you will read later — becomes a searchable, filterable nugget. The bot does the work of summarizing, tagging, and filing. The web app is where you come back and find it.

The system is built around a single use case: catching things you would otherwise forget, without having to stop what you are doing to organize them.

## Getting started

1. Open the bot in Telegram: **[@supernuggetss_bot](https://t.me/supernuggetss_bot)**
2. Tap **Start** (or send `/start`). The bot replies with the system manifesto **and your personal vault link** — something like `https://supernuggets.app/u/<your-token>`. This is your private dashboard.
3. **Bookmark the vault link.** Anyone who has it can read your nuggets, so treat it like a password. If you ever need it again, send `/myvault` to the bot.
4. Send anything to the bot — a message, a photo, a voice note, a video, or a link. The bot replies with a receipt confirming the nugget has been saved, its folder, its tags, and a one-tap **OPEN** button that deep-links into your private vault.
5. Browse, search, edit, and rediscover what you have saved in the web app.

The public site at **[supernuggets.app](https://supernuggets.app)** itself only shows a landing card pointing at the bot — every visitor needs their own vault link to see anything.

Each non-owner account is rate-limited to five nuggets per UTC day; the bot tells you exactly how long until the next reset when you hit the cap.

<img width="709" height="674" alt="image" src="https://github.com/user-attachments/assets/2265fd63-3fe0-41b9-96a8-e28f7ccd06e9" />

---

## Bot features

### What you can send

The bot accepts six input types. Each one is handled by a different pipeline, but the result is always the same shape — a nugget with a folder, summary, tags, and (where it applies) a link back to the source.

#### Text messages

Type or paste anything: a thought you want to remember, a quote, a name, a list, a phone number, an idea. The bot classifies it into one of twelve folders, writes a short summary, and assigns tags.

> *Example:* you message the bot "the wine bar near St. Mark's that does the natural orange wine and the squid ink rice." Later, you search for "natural wine" or filter by the **Food** folder and it surfaces.

#### Photos and photo albums

Send a single photo or an album of up to ten. The bot reads any text in the image (labels, screenshots, recipe cards, handwritten notes, slide decks), identifies what is shown, and writes a summary covering the whole batch. Images are downscaled and stripped of metadata before analysis.

> *Example:* you take photos of three skincare products on a shelf at Sephora. The bot extracts every visible word — brand, product name, claims, ingredients — and files the lot under **Beauty** with tags like `#retinol`, `#sensitive_skin`.

#### Voice notes

Hold the microphone and talk. The bot transcribes the audio and treats the transcript as a text message — same folder, summary, and tag pipeline.

> *Example:* mid-walk, you remember three things you need to tell your dentist. You record a voice note. The transcript lands in **Health** with a clean bullet summary, and the original voice message stays in your chat history.

#### Video clips

Send a video file up to 20 MB. The bot transcribes the audio, then summarizes and files based on what was said. If the clip arrived from a link, the bot also re-uploads the downloaded video to chat so you can re-watch without revisiting the original.

> *Example:* a friend films their espresso-machine setup and the steps they use. You forward the clip. The bot transcribes the explanation, files it under **Food**, and you can pull it up the next time you are buying coffee.

#### Social media links

Paste a link from any of these platforms and the bot will download and process it:

| Platform | What it handles |
|---|---|
| TikTok | Video posts (photo carousels not yet supported) |
| Instagram | Reels (public photo posts and login-required posts return a clear rejection message) |
| YouTube | Shorts only (longer videos are out of scope) |
| Twitter / X | Video posts |
| Pinterest | Video pins |
| Reddit | Video posts |
| Threads | Video posts |

For video links, the bot downloads the clip, transcribes it, and files the resulting nugget with a link back to the original. Per-platform duration caps keep ingest times short and costs bounded; clips longer than the cap return a rejection message rather than processing.

> *Example:* you see a TikTok on training a dog to ring a bell for outside. You drop the link into the chat. The bot transcribes the demo, summarizes the three steps, files it under **Personal** with `#dog_training`, and gives you a one-tap link back to the original video.

#### Article links

Paste any other web link — a Substack post, a news article, a long blog post — and the bot extracts the main text (skipping nav bars, comments, ads), summarizes it, and files it. Paywalled articles return only the public preview; the bot never bypasses paywalls.

> *Example:* you skim a 4,000-word essay you do not have time to finish. You send the link. The bot files it under **Grow** with a three-bullet summary, the full extracted body preserved on the detail page for later reading, and tags so you can find it again by topic.

You can also send text *together* with a link — the prose becomes a personal note attached to the nugget.

### What the bot sends back (the receipt)

Every saved nugget is acknowledged with a receipt in chat. The format is consistent across all input types:

- **`[FOLDER] TITLE`** — the assigned folder in brackets, followed by a short uppercase title
- **SUMMARY** — two or three bullets capturing the core content
- **MENTIONED** — named brands, products, people, or places referenced in the content, each linked to a search (omitted if nothing specific)
- **FACT-CHECK** — verifiable claims with one-sentence evidence notes (omitted if nothing to verify)
- **TRANSCRIPT** — the raw input preserved verbatim, truncated with a "full text on web" pointer if it exceeds Telegram's message length
- **TAGS** — three to five lowercase hashtags
- **SOURCE** — a one-line footer with platform, uploader, and duration for nugget that came from a link

The aesthetic is deliberately spartan: monospace, no picture emojis, status messages prefixed with bracketed tags like `[err]`, `[limit]`, `[warn]`. Inline buttons under each receipt let you open the nugget on the web (`⬈ OPEN`), jump to the original source (`↗ SOURCE`), or delete the entry (`⌫ DELETE`).

### Commands

| Command | What it does |
|---|---|
| `/start` | Shows the manifesto, capability list, and your personal vault link |
| `/help` | Same as `/start` — a reminder of what the bot accepts and your vault URL |
| `/myvault` | Re-sends just your private vault link (useful if you lost the bookmark) |

All three are registered with Telegram so they appear in the command-suggestion popup when you type `/`.

### Delete flow

Tapping `⌫ DELETE` on any receipt opens a two-step confirmation: `✓ YES DELETE` to remove the nugget from the vault, `✗ CANCEL` to abort and restore the original buttons. Deletions are scoped to the user who created the nugget — no one else can remove your entries.

### Quotas and rate limits

- **5 nuggets per UTC day** for general users (the owner account is unlimited).
- **20 MB** maximum for direct video uploads (Telegram's bot-API cap).
- **Per-platform duration caps** for video links — anything beyond the cap is rejected before any cost is incurred.

Hitting any limit returns a clear message with a tag (e.g. `[limit] 5/5 today, resets in 6h 23m`).

---

## Web app features

The web app is the visual front door for everything you have saved. It is laid out around a Pinterest-style card grid with a left sidebar for navigation.

### Browse — the main grid

The home view is a responsive masonry grid of card previews, denser than a typical dashboard so you can scan a lot at once. Each card shows the folder accent stripe, the title, a short preview line, and the first three tags with an overflow indicator if there are more. Hovering a card lifts it with a sticker-shadow effect to signal it is clickable.

<img width="1440" height="813" alt="image" src="https://github.com/user-attachments/assets/6b3bb2a1-431c-4977-80a5-a90f561d0ee4" />

### Folders

Twelve fixed folders, each with its own accent color:

```
Grow · Leisure · Health · Creativity · Money · Work
Curation · Personal · Beauty · Food · Travel · Sport
```

The folder bar at the top of the grid shows the count of nuggets in each folder (`GROW · 12`). Clicking a folder filters the grid; clicking `ALL` clears the filter.

### Tags

Every nugget carries three to five hashtags. Tags are clickable everywhere they appear — on cards in the grid and on the detail view — and clicking one filters the grid to that exact tag. The active tag is shown as a removable chip at the top of the grid.

### Search

A search box above the grid does case-insensitive substring matching across nugget titles, summaries, tag lists, and folder names. Search composes with the folder filter and the active tag — applying all three at once just narrows further.

### Detail view

Clicking a card opens a real route at `/n/<id>` — not a modal — so the browser back button works and the URL is bookmarkable. The detail view shows the full title, folder, date, summary bullets, mentioned entities, fact-check items, full transcript, source link (for URL-derived nuggets), and the complete tag list.

<img width="1440" height="813" alt="image" src="https://github.com/user-attachments/assets/adc7d48e-f81c-4004-b9d1-64f5f93f38f3" />

### Edit and delete

From the detail view you can:

- Change a nugget's folder via a dropdown
- Add or remove tags inline
- Delete the nugget (writes back to the database, not just local state)

### Resurface

A `RESURFACE` action in the sidebar surfaces a random nugget from your vault — a way to bump into things you have saved and forgotten. Useful when you want a starting point for browsing rather than a specific search.

### Stats

The `/stats` page is a quiet dashboard rather than a vanity-metrics blowout. It shows:

- **Total nuggets** — the headline number, big and stark at the top
- **Daily streak** — consecutive UTC days with at least one nugget saved
- **Last 30 days** — total intake in the last month
- **Last added** — the most recent nugget, clickable to its detail view
- **Folder breakdown** — a horizontal bar chart of nuggets per folder, sorted descending, each bar clickable to filter the grid to that folder

### Light and dark themes

A `DARK` / `LIGHT` toggle in the sidebar switches the whole app between a warm cream-paper light theme and a darker variant. The folder accent palette is designed to stay legible against both.

### Sidebar and mobile nav

The left sidebar holds the primary nav (`BROWSE`, `RESURFACE`, `STATS`), a quick link to the Telegram bot (`BOT`), and the theme toggle. It can be collapsed to a slim icon rail by clicking the chevron at the bottom. On mobile, the sidebar is replaced by a compact bottom navigation bar.

---

## Built with

| Layer | Technology |
|---|---|
| Web framework | Next.js (App Router), TypeScript, Tailwind, shadcn/ui |
| Bot framework | aiogram v3 (Python) |
| Database | Supabase (Postgres) |
| Language and vision AI | Anthropic Claude |
| Audio transcription | OpenAI Whisper |
| Media extraction | yt-dlp, trafilatura, Pillow |
