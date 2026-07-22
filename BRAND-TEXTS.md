# Supernuggets — Copy Inventory

Полный список всех текстов, которые видит пользователь: бот в Telegram + сайт. Собрано для передачи бренд-дизайнеру на полный ребрендинг текста.

## 1. TELEGRAM БОТ (`~/supernuggets-bot`)

### 1.1 Меню команд (`bot.py` → `set_my_commands`)
`/start` — "about supernuggets", `/help` — "user guide", `/myvault` — "get my vault link", `/timezone` — "set my timezone for digests", `/digest_on` — "i want to receive digests", `/digest_off` — "i don't want to receive digests", `/digest_status` — "show my digest preferences"

### 1.1b Постоянное reply-меню (`MAIN_KEYBOARD`, 6 кнопок, `is_persistent=True`, обновлено 2026-07-04)
`📁 my vault` · `❓ help` · `📍 send location` (шлёт локацию напрямую через `request_location=True` — определяет таймзону; раньше называлась `⏰ timezone`, переименована, т.к. пользователь путался, что кнопка не про "включить таймзону", а про "прислать геолокацию") · `📊 digest status` · `✅ digest on` · `🚫 digest off`. Показывается сразу на `/start`, остаётся видимым постоянно.

### 1.2a `/start` (`_build_start_text()`) — только манифест, без vault-ссылки и без списка команд (обновлено 2026-07-04 — команды вынесены в отдельную `_build_help_text()`, см. 1.2b)

```
supernuggets
----------------------------------
okay here's the deal — think of me as your personal AI chef: send me text, screenshots, voice notes, video circles, or regular videos, and I'll break it down, fact-check it, tag it, and file it into your vault so you can actually find it again. paste a tiktok, youtube short, twitter/x, pinterest, or threads link and I'll pull it in the same way.

oh, and you'll get a digest every week, month, and year — a recap of everything you've saved, so it's not just sitting there being ignored. the web vault also has stats, search, and a "surprise me" button if you want to get re-acquainted with old saves.
```

`/start` шлёт 3 сообщения подряд: (1) манифест выше (с `ReplyKeyboardRemove()` — очищает залипшую клавиатуру от старых версий), (2) vault-ссылка (см. 1.3), (3) `"okay, one last thing before i let you go — hit /timezone so i actually know your timezone for the digests. heads up though: it only works in the telegram phone app, not desktop."` (Stephanie Soo voice, 2026-07-23). Постоянной reply-клавиатуры больше нет — кнопка локации показывается только на `/timezone`.

### 1.2b `/help` (`_build_help_text()`) — манифест + полный список команд

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

### 1.2c `/timezone` — показывает одноразовую кнопку запроса локации (`LOCATION_KEYBOARD`, `one_time_keyboard=True`)
`"tap 📍 send location below — i'll detect your timezone from it\n(this only works in the Telegram mobile app, not desktop/web)"`

Важно: `request_location` работает **только в мобильном Telegram**. В Desktop/Web кнопка ничего не отправляет (схлопывается, апдейт в бот не приходит) — потому в тексте явная пометка.

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

TIKTOK_AGE_GATED (добавлено 2026-07-21) — "tiktok flagged this one as sensitive/mature and hides it from logged-out viewers — not a bot malfunction, just their own age gate. forward it through @SaveAsBot first, then send it my way"

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
receipts (было fact-check, переименовано 2026-07-04)
!!! verify before you trust it — ai and the internet can both be wrong
▪ ссылка на claim · хеджированное мнение модели (не вердикт, не пересказ транскрипта)
--------------------
mentioned / description / transcript(или content/article) / tags / source
```

### 1.12 Дайджесты (`digest.py`) — полный ререрайт (2026-07-19, owner-approved)

**История версий:** Wrapped-редизайн (2026-07-03, box-эмодзи-скелет) → фрейм/эмодзи очистка (2026-07-19 утро, тот же скелет без рамок) → **этот, финальный формат** (2026-07-19 вечер, полный редизайн после итеративной сессии с владельцем — обе промежуточные версии заменены целиком, детали не сохраняем, они больше не в коде).

**Почему переделали:** владелец прогнал несколько раундов живой правки прямо в чате (не через файлы) и отверг: (1) любые рамки/линии («супер тупо»), (2) дашборд-стиль цифр («saves · active days · vs last week» — никому не интересно), (3) generic AI-инсайты без привязки к конкретным сохранёнкам, (4) придуманные факты о поведении пользователя («cooking exactly none of them» — бот не знает, готовила ли она). Итог: дайджест — не аналитика, а тёплая записка от волта с конкретными сохранёнками, которые стоит пересмотреть.

**Новая структура (одна на все три типа: weekly / monthly / yir):**
```
your {week/month/{year}} in the vault

{intro — 2-3 предложения, AI, тема периода}

a few nuggets to pull back up, one from each corner of your {week/month/year}:
▪ <a>TITLE</a> (folder)
▪ <a>TITLE</a> (folder)
▪ <a>TITLE</a> (folder)
[+1 для monthly/yir — 4 пика вместо 3]

the random nugget:
▪ <a>TITLE</a> (folder) — {random_blurb, AI, только про этот пик}

[YIR only: "how the year went, season by season:" + ▪ season — summary ×4]

{main_character — YIR only, AI: "your main character this year was X. {dry tail}"}

{nudge — 1 предложение, AI, персонализирован под тему периода}

→ <a>open your {week/month/whole year} in the vault</a>
```

**Пустое состояние** (без AI-вызова, статичный текст):
```
your {week/month/{year}} in the vault

{статичная фраза, per kind — см. ниже}

→ <a>your vault's still here</a>
```

**Что убрано полностью:** ВСЕ рамки/боксы/разделители (`═`, `━`, `┌─┐`), ВСЕ picture-эмодзи (`🤖 📊 💡 👉`), дашборд-строка цифр (`N saves · active days · vs prior period`), AI-кластеры (`extract_clusters` — удалена функция целиком, больше не вызывается), сезонная генерация не тронута, но теперь описывает реальные темы, а не абстрактные "streak"-факты.

**Что новое:**
- **`pick_across_folders(entries, n)`** (код, не AI) — берёт по одной самой свежей сохранёнке из N самых насыщенных папок (3 для недели, 4 для месяца/года). Гарантирует разброс по темам, не одну случайную папку.
- **`pick_random(entries, exclude_ids)`** (код) — one random nugget, явный кивок на кнопку shuffle/"surprise me" в интерфейсе волта. Владелец отдельно одобрил эту идею как фичу, не баг.
- **`generate_digest_copy()`** — один AI tool-call (`emit_digest_copy`) генерит разом `intro` / `random_blurb` / `nudge` / (только yir) `main_character`. Промпт (`DIGEST_COPY_SYSTEM_PROMPT`) жёстко запрещает выдумывать поведение/чувства пользователя — модель описывает ТОЛЬКО то, что реально сохранено (темы, папки, тайминг). Самоирония — только про бота/волт, никогда про пользователя. Nudge обязан быть персонализирован под тему периода (еда → «иди поешь», путешествия → «иди съезди»), не generic.
- Голос: болтливый, тёплый, второе лицо (`your`, сообщение ПОЛЬЗОВАТЕЛЮ, не `my`), в стиле Stephanie Soo storytime — но без придуманных фактов о поведении.
- Термин **«nugget»** (бренд-слово для сохранёнки) вплетён в текст естественно: «six nuggets», «the random nugget», «a whole year of nuggets».
- Ссылка на дайджест теперь `→ <a>open your {period} in the vault</a>` (стрелка, не `👉`/`read this in my vault:`).
- Truncate-нотис (Telegram, длинные дайджесты): `…that's the short version — the rest is in your vault`.

**Empty-state тексты** (per kind, статичные — AI не вызывается, если сохранений 0):
- week: `nothing this week — not a single nugget. either you went outside or you forgot i exist, both fine. forward me something when you're back.`
- month: `a whole month and not one nugget landed in here. proud of you, honestly — go touch grass, don't tell the vault. send me something when you're ready.`
- year: `a whole year, zero nuggets. either that's impressive restraint or we just met. either way — forward me something and let's make next year messier.`

**Парсер сайта `lib/digest-body.tsx`:** переписан под новую грамматику — `NEW_TITLE_RE` (`your … in the vault` заголовок), `ARROW_LINK_RE` (`→ <a>…</a>` замыкающая ссылка), `LABEL_RE` (любая строка, оканчивающаяся на `:`, не начинающаяся с `▪`/`●` — ловит `a few nuggets to pull back up…:` и `the random nugget:` как секционные лейблы). Легаси regex-ы (эмодзи, боксы, `_BORDER`/`_SEP`, старый `UPPER_HEADER_RE`) оставлены нетронутыми — старые дайджесты в БД (обе прошлые версии формата) продолжают рендериться со своими стилями, ничего не мигрировано ретроактивно.

**Что НЕ тронуто:** receipt-формат сохранённых нагетсов (`pipeline.render()`) — свой отдельный, залоченный формат, из этого редизайна не менялся ни разу за всю сессию.

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
секции `summary · receipts (было fact-check) · mentioned · description · transcript · tags · source · links`; receipts-секция теперь без `✓` (было ложное "подтверждено") — нейтральный `▪` + одна строка ворнинга "!!! verify before you trust it — ai and the internet can both be wrong"; "Delete this nugget? Once it's gone from the vault, it can't come back."

### 2.7 Статистика
"total nuggets in vault", "daily streak", "last 30 days", "folder breakdown"

### 2.8 Дайджесты (веб)
"no digests yet. enable /digest_on in the bot and digests will appear here." + "OPEN BOT"; типы "Weekly/Monthly/Year in Review"; кнопка "share" → "copied!"; карточка галереи — "view digest →" (было "view →", уточнено при визуальном полишинге 2026-07-02)
