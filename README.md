# supernuggets

## About supernuggets

supernuggets is a personal knowledge capture tool. It pairs a Telegram bot with a web app, so anything worth remembering — a recipe a friend rattled off, a skincare routine you saw on TikTok, a product name you spotted on a label, a long article you swear you will read later — becomes a searchable, filterable nugget. The bot does the work of summarizing, tagging, and filing. The web app is where you come back and find it.

The system is built around a single use case: catching things you would otherwise forget, without having to stop what you are doing to organize them.

## What you can send to the bot

The bot accepts six input types. Each one is handled by a different pipeline, but the result is always the same shape — a nugget with a folder, summary, tags, and (where it applies) a link back to the source.

### Text messages

Type or paste anything: a thought you want to remember, a quote, a name, a list, a phone number, an idea. The bot classifies it into one of twelve folders, writes a short summary, and assigns tags.

> *Example:* you message the bot "the wine bar near St. Mark's that does the natural orange wine and the squid ink rice." Later, you search for "natural wine" or filter by the **Food** folder and it surfaces.

### Photos and photo albums

Send a single photo or an album of up to ten. The bot reads any text in the image (labels, screenshots, recipe cards, handwritten notes, slide decks), identifies what is shown, and writes a summary covering the whole batch.

> *Example:* you take photos of three skincare products on a shelf at Sephora. The bot extracts every visible word — brand, product name, claims, ingredients — and files the lot under **Beauty** with tags like `#retinol`, `#sensitive_skin`.

### Voice notes

Hold the microphone and talk. The bot transcribes the audio and treats the transcript as a text message — same folder/summary/tag pipeline.

> *Example:* mid-walk, you remember three things you need to tell your dentist. You record a voice note. The transcript lands in **Health** with a clean bullet summary and the original audio preserved.

### Video clips

Send a video file up to 20 MB. The bot transcribes the audio with Whisper, then summarizes and files based on what was said. Visual content without spoken audio currently falls back to caption + tags.

> *Example:* a friend films their espresso-machine setup and the steps they use. You forward the clip. The bot transcribes the explanation, files it under **Food**, and you can pull it up the next time you are buying coffee.

### Social media links

Paste a link from any of these platforms and the bot will download and process it:

| Platform | What it handles |
|---|---|
| TikTok | Video posts (photo carousels not yet supported) |
| Instagram | Reels (photo posts not supported when private) |
| YouTube | Shorts only |
| Twitter / X | Video posts |
| Pinterest | Video pins |
| Reddit | Video posts |
| Threads | Video posts |

For video links, the bot downloads the clip, transcribes it, and files the resulting nugget with a link back to the original. The original URL is always preserved so you can re-watch the source.

> *Example:* you see a TikTok on training a dog to ring a bell for outside. You drop the link into the chat. The bot transcribes the demo, summarizes the three steps, files it under **Personal** with `#dog_training`, and gives you a one-tap link back to the original video.

### Article links

Paste any other web link — a Substack post, a news article, a long blog post — and the bot extracts the main text (skipping nav bars, comments, ads), summarizes it, and files it. Paywalled articles return only the public preview.

> *Example:* you skim a 4,000-word essay you do not have time to finish. You send the link. The bot files it under **Grow** with a three-bullet summary, the full extracted body preserved on the detail page for later reading, and tags so you can find it again by topic.

You can also send text *together* with a link — the prose becomes a personal note attached to the nugget.

## How saved items are organized

Every nugget is filed into exactly one of twelve fixed folders:

```
Grow · Leisure · Health · Creativity · Money · Work
Curation · Personal · Beauty · Food · Travel · Sport
```

The folder taxonomy is intentionally small. Finer-grained classification is handled by three to five hashtags assigned to every nugget. Together, folder + tags give you two complementary ways to find things.

Each nugget also includes:

- **Summary** — two or three bullets capturing the core content
- **Mentioned** — named brands, products, people, or places referenced in the content, each linked to a search
- **Fact-check** — verifiable claims with one-sentence evidence notes
- **Transcript** — the raw input preserved verbatim (the article body, the voice transcription, the OCR text, etc.)
- **Source** — link back to the original URL where applicable

## How to browse what you have saved

The web app presents your saved nuggets as a Pinterest-style card grid. From there you can:

- Filter the grid by folder
- Click any tag to filter by that tag
- Open any card for the full detail view, including the original transcript, fact-check section, and source link
- Edit a nugget's folder or tags after the fact
- Delete a nugget (with a confirmation step)

The detail view is a real URL, so individual nuggets can be bookmarked and the browser back button works as expected.

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
