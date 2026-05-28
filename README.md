# supernuggets

## About supernuggets

supernuggets is a personal knowledge capture tool. It pairs a Telegram bot with a web app: anything you send to the bot becomes a searchable, filterable nugget — summarized, tagged, and filed automatically. The web app is where you browse and rediscover what you have saved.

## What you can send to the bot

| Input | What happens |
|---|---|
| Text message | Classified into a folder, tagged, and summarized |
| Photo or photo album | Image content analysed; on-image text extracted |
| Voice note | Transcribed, then handled like a text message |
| Video clip | Audio transcribed and summarized |
| Social media link | Media downloaded from TikTok, Instagram, YouTube Shorts, Twitter/X, Pinterest, Reddit, or Threads, then handled by the matching pipeline |
| Article link | Main article text extracted and summarized |

Every nugget receives a short summary, three to five hashtags, and — where applicable — a link back to the original source.

## How saved items are organized

Each nugget is filed into exactly one of twelve fixed folders:

```
Grow · Leisure · Health · Creativity · Money · Work
Curation · Personal · Beauty · Food · Travel · Sport
```

The folder taxonomy is intentionally small and fixed. Tags handle finer-grained classification.

## How to browse what you have saved

The web app presents your saved nuggets as a card grid. You can:

- Filter by folder
- Search or filter by tag
- Open any nugget for the full detail view, including the original transcript or article body
- Edit a nugget's folder or tags, or delete it
<img width="1440" height="813" alt="image" src="https://github.com/user-attachments/assets/6b3bb2a1-431c-4977-80a5-a90f561d0ee4" />

## Built with

| Layer | Technology |
|---|---|
| Web framework | Next.js (App Router), TypeScript, Tailwind, shadcn/ui |
| Bot framework | aiogram v3 (Python) |
| Database | Supabase (Postgres) |
| Language and vision AI | Anthropic Claude |
| Audio transcription | OpenAI Whisper |
| Media extraction | yt-dlp, trafilatura, Pillow |

## License

Personal project. Not open source.
