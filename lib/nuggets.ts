// Core Nugget types + data mapping. Single source of truth for the
// 12-folder taxonomy and the Hemeon-tinted folder palette.

export interface Mentioned {
  label: string
  url: string
}

export interface FactCheck {
  claim: string
  evidence: string
  searchQuery?: string
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
}

export type FolderType =
  | 'all'
  | 'Grow'
  | 'Leisure'
  | 'Health'
  | 'Creativity'
  | 'Money'
  | 'Work'
  | 'Curation'
  | 'Personal'
  | 'Beauty'
  | 'Food'
  | 'Travel'
  | 'Sport'

export const FOLDERS: FolderType[] = [
  'all',
  'Grow',
  'Leisure',
  'Health',
  'Creativity',
  'Money',
  'Work',
  'Curation',
  'Personal',
  'Beauty',
  'Food',
  'Travel',
  'Sport',
]

// BRAND.md §5 — Hemeon-tinted folder palette. Used inline as
// `borderTopColor` for card accent stripes and as the folder-name label color.
export const FOLDER_COLOR_HEX: Record<FolderType, string> = {
  all:        '#1A1A1A',
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

function parseTags(raw: EntryRow['tags']): string[] {
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

  const title =
    row.title?.trim() ||
    summaryBullets[0]?.slice(0, 80) ||
    'Untitled'

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
    folder: row.folder || 'Personal',
    date: row.created_at,
    dateCompact: formatDateCompact(row.created_at),
    tags: parseTags(row.tags),
    source: row.tg_message_link ? 'TG_BOT' : (row.media_type || 'MANUAL').toUpperCase(),
    mentioned,
    factChecks,
    transcript: (row.raw_content ?? '').trim(),
    extractedLinks,
  }
}
