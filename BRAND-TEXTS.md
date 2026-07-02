# Supernuggets — Copy Inventory

Полный список всех текстов, которые видит пользователь: бот в Telegram + сайт. Собрано для передачи бренд-дизайнеру на полный ребрендинг текста.

## 1. TELEGRAM БОТ (`~/supernuggets-bot`)

### 1.1 Меню команд (`bot.py` → `set_my_commands`)
`/start` — "about supernuggets", `/help` — "user guide", `/myvault` — "get my vault link", `/timezone` — "set my timezone for digests", `/digest_on` — "i want to receive digests", `/digest_off` — "i don't want to receive digests", `/digest_status` — "show my digest preferences"

### 1.2 `/start` и `/help` (`_build_start_text()`) — только манифест, без vault-ссылки (та отдельным сообщением, см. 1.3)

```
supernuggets
----------------------------------
okay here's the deal — think of me as your personal AI chef: send me text, screenshots, voice notes, video circles, or regular videos, and I'll break it down, fact-check it, tag it, and file it into your vault so you can actually find it again. paste a tiktok, youtube short, twitter/x, pinterest, or threads link and I'll pull it in the same way.

oh, and you'll get a digest every week, month, and year — a recap of everything you've saved, so it's not just sitting there being ignored. the web vault also has stats, search, and a "surprise me" button if you want to get re-acquainted with old saves.

commands:
/help — show this again
/myvault — re-send your private vault link
/timezone — set your timezone for digests
/digest_on — turn on your digests
/digest_off — turn off your digests
/digest_status — check your digest settings
```

Список ссылок ограничен платформами, реально протестированными и рабочими на 2026-07-02 (tiktok, youtube shorts, twitter/x, pinterest, threads). Instagram, reddit, обычные статьи — не работают сейчас (см. CLAUDE.md backlog), в текст не включены до починки.

### 1.3 `/myvault` и vault-сообщение (`_build_vault_message()`) — отправляется отдельным сообщением на `/start` и по команде `/myvault`, специально чтобы можно было запинить его отдельно от манифеста

```
your private vault
↗ {vault_url}

pin this message so it's always one tap away

want it on your home screen?
first, open the link above in Safari or Chrome — not inside telegram (tap ••• → open in browser if it launched in-app)
then: iphone → tap Share ↑ → Add to Home Screen
android → tap ⋮ → Add to Home screen

this link is basically your password in — keep it somewhere you won't lose it. and hey, if you want to share your vault with someone, go for it, it's yours
```

Fallback (ссылка не подгрузилась — error state, формально, без иронии):
```
your private vault
couldn't load your link — try /myvault again in a sec
ping @holeden
```

Ошибка `/myvault` (токен не найден в БД) — "couldn't pull your vault token — try again"

### 1.4 Кнопки под каждой записью
`open` · `source` · `delete` → подтверждение: `yes, delete` / `cancel`

### 1.5 Квота
"that's 5 for today — back in {Xh Ym}"

Сбой проверки квоты — "quota check glitched — try again" (формально, ошибка → правило 2, обёрнуто в футер 1.6)

### 1.6 Футер всех ошибок
"{текст}\n\nping @holeden" (безусловно, без "if it keeps happening" — правило 2 BRAND.md)

### 1.7 Сообщения по хендлерам (полный список)

- ai pipeline glitched — try sending again
- got {N} images — give me a second...
- none of the images downloaded — try sending them again
- vision pipeline failed on this one
- image batch glitched mid-save — try re-sending
- couldn't download this video
- audio transcription failed
- this clip is {X}MB — Telegram cuts off at 20MB. try a shorter version?
- no audio track found — try a clearer file or just text it to me
- almost no audio or visuals to work with — add a caption if you still want to save it
- couldn't grab that voice note
- couldn't hear anything — try speaking clearer, or just type it out
- that voice note was too short to summarize — give me more detail or just type it out
- couldn't process this URL
- i don't recognize this link — might be behind a paywall, login wall, or heavy JS
- article extraction failed — try again or send a screenshot
- couldn't download the images
- db save failed
- saved as #{id} but Telegram couldn't show it — check the web vault
- can't process this type yet — type /start to see what works
- wiped from the vault / can't delete — not yours or already gone

### 1.8 Отказы по URL
TIKTOK_PHOTO, INSTAGRAM_PHOTO, YT_SHORTS_ONLY — формальные, без правки (см. `pipeline.py` → `URLRejected`)

INSTAGRAM_LOGIN — "meta won't let me touch instagram officially, and honestly? I'm just one girl running a nuggets bot — not worth getting blocked over. forward it through @SaveAsBot first, then send it my way"

VIDEO_TOO_LONG — "too long — {duration}s, limit for {ekey} is {cap}s. trim it and resend"

### 1.9 Таймзона
"📍 send location" / "tap the button below to share your location — i'll detect your timezone" / "✓ got it — your timezone's {name} now"

### 1.10 Дайджест on/off/status
"✓ enabled. you'll get your weekly/monthly/yearly digest" / "✓ digests disabled" / "📊 digest status\n\ntimezone: {tz}\ndigests: (enabled by default once you set a timezone)"

### 1.11 Формат "квитанции" (`pipeline.py` → `render()`)
разделитель `--------------------`:

```
[FOLDER] ЗАГОЛОВОК
--------------------
summary
• буллет
--------------------
fact-check / mentioned / description / transcript(или content/article) / tags / source
```

### 1.12 Дайджесты (`digest.py`)
"my week // {период}", "🤖 insights:", "🔥 what you were into:", "⚡︎ other folders:", "[⚡︎ go sort your mess]", "💡 notes:", месячный — "my month // {период}", "🧠 top clusters:", "📊 metrics:", годовой — "my {year} //", "⏳ the {year} kaleidoscope:".

**Важно:** `insights` и `notes` — это генерируемый Claude текст по системным промптам с заданным тоном (sharp/dry для insights, "как BMO из Adventure Time" для notes) — если менять голос бота, промпты тоже переписывать.

## 2. САЙТ (`~/supernuggets`)

### 2.1 Метаданные
title "supernuggets // vault dashboard" / "supernuggets · your personal vault", description "A clean, fast pocket vault for everything worth keeping."

### 2.2 PWA-манифест
name/short_name "supernuggets"

### 2.3 Лендинг (`app/page.tsx`)

- Бегущая строка: "IT IS LITERALLY SO SATISFYING — WATCHING EVERY PIECE OF CONTENT YOU LIKE ACCURATELY AND AUTOMATICALLY INDEXED INTO PERFECT DIRECTORIES..."
- Заголовок: "Save anything. Find everything."
- Подзаголовок: "Think of the bot as your personal AI chef..."
- 3 шага: "1. You send it to the bot" / "2. The AI does the actual work" / "3. And then you can actually find it again"
- CTA: "LAUNCH IN TELEGRAM ↗", "↗ Open my vault", "Already have a vault? Open the bot → send /myvault"
- Блок "why" — 4 абзаца личной истории от первого лица (самый "голосовой" текст сайта, строки 158–221)
- Футер: "⬈ github" / "⬈ created by"

### 2.4 Sidebar/шапка
кнопки `random · stats · digests · open bot · dark/light mode · text scale · sort`; поиск-плейсхолдер "Find a nugget..."; папки `skin · make · food · body · learn · work · fun · go · mind · other`; пасхалка при 5 кликах по лого (5 случайных фраз про "выйди на улицу")

### 2.5 Пустой грид
"i'm actually obsessed with how empty this is. / nothing found. seriously, go outside. the sun is literally waiting for you." + кнопка "RESET"

### 2.6 Страница нагетта
секции `summary · fact-check · mentioned · description · transcript · tags · source · links`; "Delete this nugget? Once it's gone from the vault, it can't come back."

### 2.7 Статистика
"total nuggets in vault", "daily streak", "last 30 days", "folder breakdown"

### 2.8 Дайджесты (веб)
"no digests yet. enable /digest_on in the bot and digests will appear here." + "OPEN BOT"; типы "Weekly/Monthly/Year in Review"; кнопка "share" → "copied!"; карточка галереи — "view digest →" (было "view →", уточнено при визуальном полишинге 2026-07-02)
