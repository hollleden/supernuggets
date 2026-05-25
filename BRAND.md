# supernuggets · brand & design spec

Source of truth for visual identity, naming conventions, and system copy across the bot and web. When writing new UI text, error messages, status logs, or designing web components — **conform to this spec**.

**Status legend:**
- ✅ **Live** — already implemented and shipped
- 🎯 **Adopt** — agreed direction, apply when next touching the relevant code
- ⏳ **Future** — spec for the upcoming web rewrite, not implemented yet

---

## Aesthetic profile

**Late-90s tactile utility companion.** Pocket PDA / retro freeware utility / digital zine. High-performance pocket database vibe — rejects cartoonish fluff, avoids cold sterile minimalism. Clean layouts, crisp lines, tactile physical feedback.

**Tone for all system messages:** unemotional, hyper-efficient mainframe issuing receipt logs and diagnostic metrics. Never speak as an AI. Use system prefixes (`[SYS]`, `[BATCH]`, `[FAIL]`, `[WARN]`, etc.). Embrace technical automation phrasing.

**No picture emojis anywhere** (locked decision). Unicode geometric symbols (▪ • ✓ ✗ ⌫ ⬈ ↩ ↻) are allowed where they read as technical glyphs.

---

## 1. Nomenclature glossary

| Object | Code / DB entity | UI term | Status |
|---|---|---|---|
| The project | `supernuggets` | **SUPERNUGGETS** | ✅ |
| A saved item | `entries` row | **Nugget** | 🎯 Adopt in user-facing copy; DB schema unchanged |
| Web visual element | `component` | **Card** | 🎯 |
| Database | `supabase_db` | **The Vault** | 🎯 |
| Web frontend | `~/supernuggets` | **Dashboard** | 🎯 |
| The 12 categories | `folder` | **Folder** | ✅ |
| Multi-photo group | `image_group` / album | **Batch** | ✅ |

---

## 2. Visual design system (web · ⏳ future rewrite)

Current frontend uses v0.dev-generated aesthetics. This section is the target spec for the upcoming web redesign.

### Core metaphor
High-performance pocket database. Custom 90s utility software. Tangible premium texture.

### Spatial hierarchy
- **Background tone:** warm soft cream paper `#F5F4EE` (replaces modern cold whites / dark mode)
- **Border definition:** 1px or 2px absolute black `#000000`. Soft drop-shadows strictly forbidden.
- **Sticker depth effect:** sharp hard-offset box shadow `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` appears on **hover/focus only**, not at rest. Default card state is flat — keeps the grid Pinterest-dense; sticker depth becomes the "click me" affordance.
- **Interaction rule (Inverted Flash):** focused / clicked elements **invert colors instantly** (light mode: white-on-black ↔ black-on-white; dark mode: see §7 — Hemeon-orange-on-sepia). No glow gradients.
- **Empty state texture:** CSS pixel dithering (checkerboard grid) instead of opacity fades.

### Tailwind v4 token foundations (`app/globals.css`)

```css
:root {
  --bg-app: #F5F4EE;          /* Weathered Engineering Cream */
  --surface: #FFFFFF;         /* Pure White Card Canvas */
  --border-pure: #000000;     /* Strong Structural Linework */
  --border-muted: #CCCCCC;    /* Accent Matrix Grids */
  --text-main: #1A1A1A;       /* Off-Black High-Readability Type */
  --text-muted: #666666;      /* Sub-Labels & Structural Data */
}

@utility bg-dither {
  background-color: #ffffff;
  background-image: radial-gradient(#000000 1px, transparent 1px),
                    radial-gradient(#000000 1px, #ffffff 1px);
  background-size: 4px 4px;
  background-position: 0 0, 2px 2px;
}
```

### Typographic contrast rules
All text monospaced. Variety from contrasting raw-tight-heavy headers against micro-scale uppercase wide-tracked metadata.

| Role | Spec |
|---|---|
| Main app branding header | `text-2xl`, extra bold, `tracking-tight`, UPPERCASE |
| Card title | `text-sm`, extra bold, `tracking-normal`, UPPERCASE |
| Main text copy | `text-xs`, medium weight, normal case, `leading-relaxed` |
| System labels / metadata stamps | `text-[9px]`, bold, UPPERCASE, `tracking-widest` |

---

## 3. Telegram bot production strings (`@supernuggets_bot`)

All system messages follow the mainframe receipt style: UPPERCASE, `[TAG]` prefix in brackets, `----------------------------------` divider (34 hyphens), `KEY  // VALUE` lines, `cc: @holeden` footer on failures.

`[LIMIT]` and `[SYS]` messages do **not** get the `@holeden` footer (expected behavior, not bugs).

### A. `/start` — system manifesto

🎯 **Status:** Spec target; current bot uses a shorter version. Apply when next touching bot copy.

```
SUPERNUGGETS MAINFRAME // v0.4
----------------------------------
READY FOR INBOUND DATA ACQUISITION
ACCEPTING TEXT + IMAGE INTAKE

AUTOMATED PIPELINE PROCESSING:
▪ CLAUDE CORE COMPRESSION & SUMMARIES
▪ FACT-CHECK DEVIATION AUDITS
▪ AUTOMATIC 12-TAXONOMY STRUCTURAL FILING
▪ MULTIMEDIA TRANSCRIPTION [QUEUED]
▪ URL ASSET INGESTION [QUEUED]

SYSTEM PARAMETERS:
[QUOTA] 5 ENTRIES / 24HR CYCLE (RESET 00:00 UTC)
[BATCH] MAX 10 PHOTOS PER ENTRY

TERMINAL APPARATUS MAINTENANCE:
[BUGS] REPORT CORRUPTIONS TO @holeden
```

> When the video handler ships, remove `[QUEUED]` from `MULTIMEDIA TRANSCRIPTION`. Same for URL handler.

### B. Inbound status & operation logs

**Album / batch acknowledgement:**

```
[BATCH] INBOUND // 10 IMAGES DETECTED
----------------------------------
STATUS // PROCESSING VIA CLAUDE_VISION...
```

**Daily quota exceeded** (dynamic countdown — computed at message-send time):

```
[LIMIT] QUOTA EXCEEDED
----------------------------------
USAGE  // 5 OF 5 ENTRIES USED TODAY
RESET  // IN 6H 23M (00:00 UTC)
```

**Unsupported inbound type:**

```
[WARN] CHANNEL_LOCKED // TEXT + IMAGES ONLY
----------------------------------
MEDIA TYPE NOT COMPATIBLE YET
EXECUTE /start FOR SYSTEM CAPABILITIES
```

### C. Inline buttons

**Initial action keyboard** (under every entry):

```
[ ⬈ OPEN_WEB ]   [ ⌫ ERASE_ENTRY ]
```

> `OPEN_WEB` hidden when running on localhost — Telegram rejects non-https URLs.

**Confirmation step** (after tapping `ERASE_ENTRY`):

```
[ ✓ CONFIRM_ERASE ]   [ ✗ ABORT_COMMAND ]
```

### D. Deletion outcomes

**Erase confirmed** (replaces the entry message):

```
[SYS] PURGE_COMPLETE
----------------------------------
ENTRY HAS BEEN ERASED FROM THE VAULT
```

**Erase cancelled** (toast / alert):

```
[SYS] COMMAND_ABORTED // ENTRY PRESERVED
```

**Erase denied** (toast / alert):

```
[FAIL] ACCESS_DENIED // RECORD NOT FOUND OR RESTRICTED
```

### E. Critical pipeline failures

All end with `cc: @holeden`.

**Database write rejected:**

```
[FAIL] DB_WRITE_REJECTED
----------------------------------
0 ROWS MODIFIED
DIAGNOSTIC: <code>...</code>

cc: @holeden
```

**AI text-pipeline failure (Claude / Anthropic):**

```
[FAIL] PIPELINE_CRITICAL // ANTHROPIC_CORE
----------------------------------
TRANSFORMATION SEQUENCE TERMINATED
DIAGNOSTIC: <code>...</code>

cc: @holeden
```

**Vision-pipeline failure:**

```
[FAIL] PIPELINE_CRITICAL // CLAUDE_VISION
----------------------------------
IMAGE OCR ANALYSIS ENCOUNTERED ERROR
DIAGNOSTIC: <code>...</code>

cc: @holeden
```

**Media download failure:**

```
[FAIL] ASSET_FETCH_FAILED
----------------------------------
UNABLE TO ACQUIRE ASSET BYTES FROM TELEGRAM

cc: @holeden
```

**Partial render failure** (entry saved, Telegram couldn't display):

```
[WARN] CHAT_RENDER_LIMIT_EXCEEDED
----------------------------------
STATUS  // SUCCESS
ENTRY   // RECORDED AS #{id}
NOTICE  // TELEGRAM PARSER ABORTED PRESENTATION
ACCESS  // FULL SCHEMATIC VIA WEB DASHBOARD

cc: @holeden
```

**Quota query failure** (DB unreachable while checking limit):

```
[FAIL] METRIC_QUERY_OFFLINE
----------------------------------
UNABLE TO COUNTER-CHECK DAILY LIMIT
DIAGNOSTIC: <code>...</code>

cc: @holeden
```

---

## 4. Receipt / nugget render format (✅ locked)

This is the format `pipeline.render()` already produces for every saved nugget. Documented here for reference — **do not iterate** on this layout without an explicit decision.

```
[BEAUTY] RETINOIDS VS PDRN
--------------------
SUMMARY
▪ bullet 1
▪ bullet 2
▪ bullet 3
--------------------
MENTIONED
• <a href="google-search-url">Brand — Product</a>
--------------------
FACT-CHECK
✓ <a href="google-search-url">TERM</a> · one-sentence reasoning
--------------------
TRANSCRIPT
<pre>raw text preserved here</pre>
--------------------
TAGS
#Folder #tag_with_underscore #another_tag
```

Note: receipt divider is **20 hyphens** (Telegram readable width). Status messages above use **34 hyphens** (wider terminal feel).

---

## 5. Web dashboard components (⏳ future rewrite)

### Sidebar nav

Vertical rail, fixed left. Two widths: expanded `180px` / collapsed `52px`.
Background pure white (`#FFFFFF`), 2px right border absolute black, no shadow.

Structure top-to-bottom:
1. **Logo cell** — 16×16 **pixel floppy disk** SVG (cream `#F5F4EE` body + black `#000` shutter/outline; in dark mode, swap fill to the foreground color), inline label `SUPERNUGGETS` (extra bold, `tracking-tight`, UPPERCASE, `text-xs`) when expanded. The floppy is the brand mark — late-90s pocket database aesthetic, no chicken-nugget literal-icon energy. Reserve color for content; logo stays mono.
2. **Primary nav** — `BROWSE`, `RESURFACE`
3. **Footer nav** — `DARK` / `LIGHT` toggle, `SETTINGS`
4. **Collapse caret** — full-width chevron (▸ / ◂)
5. **Version stamp** — `SYS_V0.4` (`text-[9px]`, muted, `tracking-widest`, UPPERCASE)

All labels: mono, `text-[10px]`, `tracking-wider`, UPPERCASE. Active nav item: **Inverted Flash** — pure black bg + white text. Hover state same. No rounded corners. Icons from `lucide-react`, 4×4, inherit current text color.

### Folder accent palette — Hemeon-tinted

Card canvases stay pure white (`#FFFFFF`). Folder identity shown via 2px **top border** accent + folder-name label in the same color. Never background washes.

Palette sourced from the Hemeon design poster — 12 distinct hues covering full hue space while staying in a coherent visual family. Defined once as CSS vars in `app/globals.css`, consumed in TS via a hex map.

| Folder | Color | Hex |
|---|---|---|
| Grow | mint green | `#5DA17F` |
| Leisure | magenta-purple | `#B83A8C` |
| Health | forest green | `#4D8C5D` |
| Creativity | coral pink | `#E89890` |
| Money | gold | `#F5D940` |
| Work | royal blue | `#2A4FCC` |
| Curation | warm grey | `#847E6E` |
| Personal | plum | `#6B4A8C` |
| Beauty | hot pink | `#D43A6A` |
| Food | orange | `#E04A2A` |
| Travel | sky blue | `#7AAFD4` |
| Sport | lime-yellow | `#B0CA3D` |

```typescript
export const FOLDER_COLOR_HEX: Record<FolderType, string> = {
  Grow:       '#5DA17F',
  Leisure:    '#B83A8C',
  Health:     '#4D8C5D',
  Creativity: '#E89890',
  Money:      '#F5D940',
  Work:       '#2A4FCC',
  Curation:   '#847E6E',
  Personal:   '#6B4A8C',
  Beauty:     '#D43A6A',
  Food:       '#E04A2A',
  Travel:     '#7AAFD4',
  Sport:      '#B0CA3D',
}
```

Use inline `style={{ borderTopColor: FOLDER_COLOR_HEX[folder] }}` for the accent stripe, and the same value for the folder-name label color. Single source of truth, no arbitrary-tailwind-value sprawl.

### Masonry layout — Pinterest density

```
columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4
```

Denser than typical dashboard grids. Goal: lots of nuggets visible at once, low chrome per card, content-led.

### NuggetCard template — minimal at rest, sticker on hover

```tsx
import Link from 'next/link'
import { FOLDER_COLOR_HEX } from '@/lib/nuggets'

export function NuggetCard({ nugget }: { nugget: Nugget }) {
  const folderColor = FOLDER_COLOR_HEX[nugget.folder]

  return (
    <Link
      href={`/n/${nugget.id}`}
      className="block bg-white p-4 break-inside-avoid border-t-2
        transition-all duration-150
        hover:border-2 hover:border-black hover:-translate-x-[2px] hover:-translate-y-[2px]
        hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      style={{ borderTopColor: folderColor }}
    >
      {/* Metadata: folder name (color) + compact date */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{ color: folderColor }}
        >
          {nugget.folder}
        </span>
        <time className="font-mono text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
          {nugget.dateCompact}
        </time>
      </div>

      {/* Title */}
      <h3 className="font-mono text-sm font-extrabold uppercase leading-tight text-black mb-3 line-clamp-3">
        {nugget.title}
      </h3>

      {/* Summary preview — first bullet */}
      <p className="font-mono text-xs text-zinc-700 leading-relaxed line-clamp-3 mb-3">
        {nugget.previewLine}
      </p>

      {/* Tags — plain text, clickable, no boxes */}
      <div className="flex flex-wrap gap-x-2 gap-y-1">
        {nugget.tags.slice(0, 3).map(tag => (
          <TagLink key={tag} tag={tag} />
        ))}
        {nugget.tags.length > 3 && (
          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wide">
            +{nugget.tags.length - 3}
          </span>
        )}
      </div>
    </Link>
  )
}
```

**What changed from prior template:**
- Outer border + sticker shadow only on hover (not default). Cards float flat on cream paper at rest; the shadow is the click affordance.
- Folder name as small mono text in folder color (not a black pill).
- Folder identity = top accent stripe + folder-name color, nothing else.
- No `FILE // {media_type}` stamp, no `REF_SYS //` prefix, no bigserial `#ID`.
- Summary clamped to 3 lines (was 5).
- Max 3 tags shown with `+N` overflow.
- Tags are plain text with no borders, click → global filter (see Tag click behavior).
- Whole card is `<Link>` to `/n/[id]` route, not a modal trigger.

### Detail view = own route `/n/[id]`

**Not a modal.** Real navigable URL with browser back support. Three reasons: shareable links between users, browser history works, Pinterest "dive deep then browse out" pattern.

Desktop layout (`≥ lg`):

```
┌───────────────────────────────────┬─────────────────────┐
│ [← BACK]                          │ RELATED IN HEALTH   │
│                                   │                     │
│ 2026.05.24    HEALTH              │ ┌─────┐ ┌─────┐    │
│                                   │ │ ... │ │ ... │    │
│ COLD SHOWERS & WIM HOF METHOD     │ └─────┘ └─────┘    │
│ BENEFITS                          │                     │
│                                   │ ┌─────┐ ┌─────┐    │
│ ▪ Cold showers settle at 2 min    │ │ ... │ │ ... │    │
│ ▪ Wim Hof method works for X      │ └─────┘ └─────┘    │
│ ▪ Brown fat activation at 50°F    │                     │
│                                   │                     │
│ ── TRANSCRIPT ──                  │                     │
│ <full text in <pre> mono>         │                     │
│                                   │                     │
│ #cold_exposure #wim_hof #morning  │                     │
└───────────────────────────────────┴─────────────────────┘
```

- Left column 2/3 width: main content
  - Top: `[← BACK]` button · date · folder name (in folder color)
  - Title — extra bold UPPERCASE mono, `text-3xl`
  - Summary as bulleted list — `text-sm leading-relaxed`
  - `── TRANSCRIPT ──` divider, then full transcript in `<pre>` mono
  - `── FACT-CHECK ──` and `── MENTIONED ──` if present
  - Tags row at bottom — all clickable
- Right column 1/3 width: related nuggets in same folder, mini-cards (accent stripe + title + date only)

Mobile (`< lg`): stack vertically; related-nuggets become a section below tags.

**Removed from old detail view:** `REF_SYS // MEMORY_DETAIL // #23` chrome, public/private toggle (no multi-user yet), media-type prefix. Date + folder identity carry the metadata weight.

### Tag click behavior

Every `#tag` element on cards AND in detail view is clickable. Click action: **set the global search filter to that tag** (and navigate back to grid if on a detail page). Visual: muted zinc by default, black on hover; cursor pointer. Tag clicks on cards must `e.preventDefault()` so the card's `<Link>` doesn't also fire.

---

## 6. Web error modules (⏳ future)

Place inside root error boundaries (`app/not-found.tsx` and custom error interfaces). Centered terminal layout wrapped in a 2px solid black container.

### 404 — Invalid target

```
ERROR 404 // ADDRESS NOT SPECIFIED
----------------------------------
THE SYSTEM CANNOT LOCATE THE REQUESTED
DESTINATION OR NUGGET FILE. IT MAY HAVE
BEEN RELOCATED OR PURGED.

[ ↩ RETURN TO VAULT ]
```

### 403 — Access denied

```
ERROR 403 // ACCESS DENIED
----------------------------------
SECURITY EXCEPTION: READ/WRITE PERMISSION
RESTRICTED. YOUR CREDENTIALS DO NOT MATCH
THIS VAULT DIRECTORY.

[ ↩ INITIALIZE RE-LOG ]
```

### 500 — Server core offline

```
ERROR 500 // HARDWARE UNRESPONSIVE
----------------------------------
AN INTERNAL DATA LINK FAILURE OCCURRED
MID-SEQUENCE. THE VAULT CORE IS SAFE,
BUT THE CHANNEL TIMED OUT.

[ ↻ RETRY RE-LOAD ]
```

### Empty state (0 query results)

```
VAULT REGISTRY INDEX // EMPTY
----------------------------------
0 NUGGETS FOUND MATCHING YOUR FILTERS.
ADJUST PARAMETERS OR STRUCTURAL FOLDERS
TO INDEX AGAIN.

[ CLEAR ALL FILTERS ]
```

---

## 7. Dark mode — amber CRT (⏳ future)

The cream-paper light theme is the **canonical brand**. Dark mode is a comfort variant for low-light use — NOT a separate aesthetic. Metaphor: **late-80s amber CRT terminal**, not cold-modern dark mode. Warm sepia background, warm cream-grey foreground, Hemeon-orange highlights for the "hot key" / focused-line feel. No green — green-on-black phosphor was tried and rejected.

### Token values (`app/globals.css`)

```css
.dark {
  --background:        #1F1B14;   /* sepia-dark = Hemeon cream, inverted */
  --card:              #2A251C;   /* slightly raised, warmer */
  --foreground:        #D4CDB8;   /* warm cream-grey, ~8:1 contrast */
  --border:            #D4CDB8;
  --border-muted:      #4A4538;
  --muted:             #2A251C;
  --muted-foreground:  #847E6E;
  --flash-bg:          #E04A2A;   /* Hemeon orange — "hot key" on amber CRT */
  --flash-fg:          #1F1B14;
}
```

### Visual rules in dark mode

- **Contrast target:** ~8:1, not 18:1. Cream-on-near-black was tried and rejected as eye-fatiguing. Sepia + warm-cream-grey is the canonical pairing.
- **Inverted Flash hover:** Hemeon-orange bg (`#E04A2A`) + sepia text. Reads as a "highlighted hot key" on an amber CRT line. Do not use cream/white on dark bg (too harsh); do not use green (rejected).
- **Sticker shadow inverts:** `shadow-[4px_4px_0px_0px_rgba(212,205,184,1)]` (warm-cream offset, not black). Still hover-only per §2.
- **Dither pattern:** warm-cream dots on sepia — `radial-gradient(#D4CDB8 1px, transparent 1px)` on `#1F1B14` base.
- **Folder accent strips:** keep the same Hemeon-tinted color tokens — designed to read on both light cream and sepia backgrounds.
- **Card body** stays at `--card` (`#2A251C`), NOT pure black. Preserves the "raised paper card" feel.
- **Cards in dark mode get a 1px border** on hover (not 2px) — heavy borders dominate on dark; the surface contrast already does work.

Toggle lives in the sidebar (`DARK` / `LIGHT` label, `lucide` moon/sun icon). Persists in `localStorage`. Default: respect system preference (`prefers-color-scheme: dark`).

---

## Adoption checklist

When you build a new feature, run through this:
- [ ] No picture emojis anywhere in copy
- [ ] System messages use `[TAG]` prefix (`[SYS]`, `[BATCH]`, `[FAIL]`, `[WARN]`, `[LIMIT]`)
- [ ] Dividers: 34 hyphens for status messages, 20 hyphens inside the receipt body
- [ ] Failures end with `cc: @holeden` (not `[SYS]` or `[LIMIT]` messages)
- [ ] UPPERCASE for all status copy; sentence-case acceptable inside diagnostic text
- [ ] UI uses "Nugget" / "Card" / "Vault" / "Dashboard" in user-facing copy — never "Pin", "Entry", "Memory", or "Listo"
- [ ] Web: cream bg `#F5F4EE`, pixel-floppy logo, dithered empty states
- [ ] Cards: flat at rest, sticker shadow + 2px black border on hover only
- [ ] Folder identity = 2px top border accent + folder-name label in folder color (Hemeon-tinted palette, never background washes)
- [ ] Monospace typography (JetBrains Mono) with size + weight + tracking contrast
- [ ] Card detail = real `/n/[id]` route, not a modal
- [ ] Tags on cards and detail view are clickable → set global search filter
- [ ] Dark mode = amber CRT (sepia + warm-cream-grey + Hemeon orange flash, never green/phosphor)

---

## Discrepancies fixed during this audit

For provenance — corrections made when adapting the Gemini-drafted spec to current locked decisions:

1. Removed `⚙️` from `/start` header — violates no-emoji rule
2. Removed `📂` from nomenclature table — same
3. `/start` pipeline list now marks `MULTIMEDIA TRANSCRIPTION` and `URL ASSET INGESTION` as `[QUEUED]` instead of presenting as live
4. Added inline-button copy for the initial action keyboard (`OPEN_WEB`, `ERASE_ENTRY`) — Gemini doc only covered the confirmation step
5. Quota reset line uses dynamic countdown (`IN 6H 23M`) — Gemini had static `00:00 UTC` only; we shipped dynamic
6. Renamed `INBOUND_FETCH_TIMEOUT` → `ASSET_FETCH_FAILED` (we catch generic exceptions, not specifically timeouts)
7. Added Section 4 (locked receipt format) — Gemini didn't document this; included here so the spec is complete
