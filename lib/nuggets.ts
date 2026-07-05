// Core Nugget types + data mapping. Single source of truth for the
// 10-folder taxonomy and the Hemeon-tinted folder palette.

export interface Mentioned {
  label: string
  url: string
}

export interface FactCheck {
  claim: string
  evidence: string
  searchQuery?: string
}

export interface SourceInfo {
  url: string            // canonical original URL (yt-dlp webpage_url) or article URL
  platform?: string      // 'TikTok', 'Instagram', 'YouTube', 'Article'…
  uploader?: string      // creator handle or article sitename
  durationS?: number     // for videos
  kind?: 'video' | 'images' | 'article' | string
  thumbnailUrl?: string  // yt-dlp thumbnail or article OG image
}

export interface Nugget {
  id: number
  title: string
  // First bullet, used as the card preview line. See `summaryBullets` for the full list.
  summary: string
  summaryBullets: string[]
  folder: string
  date: string          // raw ISO from DB e.g. '2026-05-24'
  dateCompact: string   // formatted for display e.g. '2026.05.24'
  tags: string[]
  source: string
  mentioned: Mentioned[]
  factChecks: FactCheck[]
  transcript: string    // raw_content (user's original message) — NOT the bot's formatted_output
  extractedLinks: string[]
  // URL-derived entries (TikTok video, Instagram Reel, Article, etc.) carry
  // the original source URL — set by the bot's URL handler, surfaced as the
  // ↗ SOURCE block on cards + detail pages.
  sourceInfo?: SourceInfo
  mediaType?: string
}

export type FolderType =
  | 'all'
  | 'skin'
  | 'make'
  | 'food'
  | 'body'
  | 'learn'
  | 'work'
  | 'fun'
  | 'go'
  | 'mind'
  | 'other'

export const FOLDERS: FolderType[] = [
  'all',
  'skin',
  'make',
  'food',
  'body',
  'learn',
  'work',
  'fun',
  'go',
  'mind',
  'other',
]

export const FOLDER_COLOR_HEX: Record<FolderType, string> = {
  all:    '#1A1A1A',
  skin:   '#D43A6A',
  make:   '#E89890',
  food:   '#E04A2A',
  body:   '#4D8C5D',
  learn:  '#5DA17F',
  work:   '#2A4FCC',
  fun:    '#B83A8C',
  go:     '#7AAFD4',
  mind:   '#6B4A8C',
  other:  '#847E6E',
}

// Raw Supabase `entries` row. `summary` is JSON-stringified array; `tags` may be
// JSON-stringified array OR a hashtag string depending on the bot version that wrote it.
export interface EntryRow {
  id: number
  user_id?: number
  created_at: string
  media_type?: string | null
  raw_content?: string | null
  summary?: string | null
  tags?: string | string[] | null
  folder?: string | null
  fact_check?: string | null
  enrichment?: string | null
  title?: string | null
  tg_message_link?: string | null
  formatted_output?: string | null
  message_id?: number | null
}

export function parseTags(raw: EntryRow['tags']): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(String).map(t => t.trim()).filter(Boolean)
  const s = String(raw).trim()
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s)
      if (Array.isArray(arr)) return arr.map(String).map(t => t.trim()).filter(Boolean)
    } catch {}
  }
  return s
    .split(/[\s,]+/)
    .map(t => t.replace(/^#/, '').trim())
    .filter(Boolean)
}

// summary column is `JSON.stringify(["bullet1","bullet2","bullet3"])`.
// Old v0 code rendered the raw string — produced literal `["bullet…` on cards.
function parseSummaryBullets(raw: string | null | undefined): string[] {
  if (!raw) return []
  const s = String(raw).trim()
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s)
      if (Array.isArray(arr)) {
        return arr.map(String).map(b => b.trim()).filter(Boolean)
      }
    } catch {}
  }
  return [s]
}

function extractLinks(text: string | null | undefined): string[] {
  if (!text) return []
  const matches = text.match(/https?:\/\/[^\s<"]+/g)
  return matches ? Array.from(new Set(matches)) : []
}

// enrichment column shape varies per entry — the bot's AI emits whatever
// categories fit the content: `places`, `fashion`, `beauty_skincare`,
// `ai_terms`, `concepts`, `websites`, `social_handles`, etc. Items are either
// bare strings or objects with `name`/`product`/`term`/`brand`/`url`/etc.
// Strategy: walk every top-level key whose value is an array, flatten items
// into a deduped {label, url} list. Synthesize Google search URLs when no
// explicit url is given (matches the bot's invisible-link convention).
// URL-derived entries (TikTok, Instagram, Article, etc.) tuck the source URL
// + platform metadata into the same `enrichment` JSON blob, under flat keys
// the bot's _save_and_reply uses. Absent for text/image entries from direct chat.
function parseSourceInfo(raw: string | null | undefined): SourceInfo | undefined {
  if (!raw) return undefined
  let parsed: unknown
  try { parsed = JSON.parse(String(raw).trim()) } catch { return undefined }
  if (!parsed || typeof parsed !== 'object') return undefined
  const obj = parsed as Record<string, unknown>
  const url = typeof obj.source_url === 'string' ? obj.source_url.trim() : ''
  const thumbUrl = typeof obj.thumbnail_url === 'string' ? obj.thumbnail_url.trim() : ''
  if (!url && !thumbUrl) return undefined
  const out: SourceInfo = { url }
  if (typeof obj.source_platform === 'string') out.platform = obj.source_platform
  if (typeof obj.source_uploader === 'string') out.uploader = obj.source_uploader
  if (typeof obj.source_duration_s === 'number') out.durationS = obj.source_duration_s
  if (typeof obj.source_kind === 'string') out.kind = obj.source_kind
  if (thumbUrl) out.thumbnailUrl = thumbUrl
  return out
}

function parseMentioned(raw: string | null | undefined): Mentioned[] {
  if (!raw) return []
  let parsed: unknown
  try { parsed = JSON.parse(String(raw).trim()) } catch { return [] }
  if (!parsed || typeof parsed !== 'object') return []

  const googleUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`
  const obj = parsed as Record<string, unknown>
  const out: Mentioned[] = []
  const seen = new Set<string>()

  for (const value of Object.values(obj)) {
    if (!Array.isArray(value)) continue
    for (const item of value) {
      let label = ''
      let url = ''
      if (typeof item === 'string') {
        label = item.trim()
      } else if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>
        const primary = String(o.product ?? o.name ?? o.term ?? o.label ?? o.handle ?? o.title ?? '').trim()
        const secondary = String(o.brand ?? '').trim()
        if (primary && secondary && primary.toLowerCase() !== secondary.toLowerCase()) {
          label = `${primary} — ${secondary}`
        } else {
          label = primary || secondary
        }
        url = String(o.url ?? o.href ?? '').trim()
      }
      if (!label) continue
      const dedupKey = label.toLowerCase()
      if (seen.has(dedupKey)) continue
      seen.add(dedupKey)
      if (!url) url = googleUrl(label)
      out.push({ label, url })
    }
  }
  return out
}

// fact_check column shape (per CLAUDE.md): JSON-stringified array of
// {claim, evidence, search_query}. Normalize field name variants.
function parseFactChecks(raw: string | null | undefined): FactCheck[] {
  if (!raw) return []
  let parsed: unknown
  try { parsed = JSON.parse(String(raw).trim()) } catch { return [] }
  if (!Array.isArray(parsed)) return []
  const out: FactCheck[] = []
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const claim = String(o.claim ?? o.term ?? '').trim()
    if (!claim) continue
    out.push({
      claim,
      evidence: String(o.evidence ?? o.reasoning ?? '').trim(),
      searchQuery: typeof o.search_query === 'string' ? o.search_query : (typeof o.searchQuery === 'string' ? o.searchQuery : undefined),
    })
  }
  return out
}

// '2026-05-24' → '2026.05.24'. Dot separator reads more compact-mono than dashes.
function formatDateCompact(iso: string | null | undefined): string {
  if (!iso) return ''
  return String(iso).slice(0, 10).replace(/-/g, '.')
}

export function mapRowToNugget(row: EntryRow): Nugget {
  const summaryBullets = parseSummaryBullets(row.summary)
  const mentioned = parseMentioned(row.enrichment)
  const factChecks = parseFactChecks(row.fact_check)
  const sourceInfo = parseSourceInfo(row.enrichment)

  const title =
    row.title?.trim() ||
    summaryBullets[0]?.slice(0, 80) ||
    'untitled nugget'

  // Links: dedupe and exclude URLs already represented in `mentioned` (those
  // are surfaced separately so they don't double-up in the LINKS section).
  const mentionedUrls = new Set(mentioned.map(m => m.url))
  const rawLinks = [
    ...extractLinks(row.raw_content),
    ...extractLinks(row.tg_message_link),
  ]
  const extractedLinks = Array.from(new Set(rawLinks)).filter(u => !mentionedUrls.has(u))

  return {
    id: row.id,
    title,
    summary: summaryBullets[0] || '',
    summaryBullets,
    folder: row.folder || 'other',
    date: row.created_at,
    dateCompact: formatDateCompact(row.created_at),
    tags: parseTags(row.tags),
    source: row.tg_message_link ? 'TG_BOT' : (row.media_type || 'MANUAL').toUpperCase(),
    mentioned,
    factChecks,
    transcript: (row.raw_content ?? '').trim(),
    extractedLinks,
    sourceInfo,
    mediaType: row.media_type ?? undefined,
  }
}

/** Format seconds into m:ss or h:mm:ss. Returns '' for 0/null. Mirrors the bot's _format_duration. */
export function formatDuration(seconds: number | undefined | null): string {
  if (!seconds) return ''
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** Build the human-readable header line for a SOURCE block, e.g. "TikTok · @user · 1:19". */
export function sourceHeaderLine(info: SourceInfo): string {
  const bits: string[] = []
  if (info.platform) bits.push(info.platform)
  if (info.uploader) bits.push(info.uploader.startsWith('@') ? info.uploader : `@${info.uploader}`)
  const dur = formatDuration(info.durationS)
  if (dur) bits.push(dur)
  return bits.join(' · ')
}

/**
 * Folder + tag counts across the whole vault — used to keep the sidebar's
 * folder/tag list populated on every route (stats, digests, nugget detail),
 * not just the main grid page where per-page filtered counts are computed.
 */
export function computeFolderTagCounts(entries: { folder: string; tags: string[] }[]) {
  const folderCounts: Record<string, number> = { all: entries.length }
  const tagCounts: Record<string, number> = {}
  for (const e of entries) {
    folderCounts[e.folder] = (folderCounts[e.folder] ?? 0) + 1
    for (const t of e.tags) {
      const tag = t.toLowerCase()
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }
  return { folderCounts, tagCounts, total: entries.length }
}
