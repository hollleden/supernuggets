import type { ReactNode } from 'react'
import sanitizeHtml from 'sanitize-html'

// Defense-in-depth: `body_html` comes from the bot (digest.py), which already
// html.escape()s all text and only ever emits <a href> and <pre> tags. But this
// renderer feeds it straight into dangerouslySetInnerHTML in ~11 spots, so we do
// NOT trust the DB value — a future bot change, a direct DB edit, or a missed
// escape upstream must not be able to inject script into a shared vault page.
// Allowlist exactly the digest grammar: <a>/<pre> tags, href only, http(s) only.
const DIGEST_SANITIZE_OPTS: sanitizeHtml.IOptions = {
  allowedTags: ['a', 'pre'],
  allowedAttributes: { a: ['href'] },
  allowedSchemes: ['http', 'https'],
  // script/style contents are dropped by default (nonTextTags); unknown tags are
  // discarded but their text kept, so legitimate copy never disappears.
  disallowedTagsMode: 'discard',
}

// Sanitize a single HTML fragment right before it is handed to
// dangerouslySetInnerHTML. Applied per-fragment (after line parsing) so it can
// never interfere with the pattern matching in renderDigestBody.
function clean(html: string): string {
  return sanitizeHtml(html, DIGEST_SANITIZE_OPTS)
}

// Bot-generated digest text (digest.py) uses a fixed line vocabulary:
// border rows ("════…"), separator rows ("━━━━…"), "┌─ label ─┐" / "└──┘"
// stat callout boxes, "🤖/📊/💡 text" lines, "👉 read this in my vault: <a>…</a>"
// self-links, "[bracket]" CTA lines, "label · value" facts, numbered clusters
// with inline "▪ <a>…</a> ▪ <a>…</a>" links, and "● SEASON — sentence" rows.
// This parses those into styled blocks instead of dumping raw pre-wrap text.
//
// Older/legacy-format digests (pre-2026-07-03 redesign) used a different
// vocabulary — "////…"/"===…"/"###…" borders, quoted "insight" paragraphs,
// " ▪ label: value" metrics, "  ● SEASON" / "    • sentence" rows. Those
// patterns are kept alongside the new ones so old rows in the DB still
// render without breaking.
const BORDER_RE = /^[/=#═]{10,}$/
const HEADER_LINE_RE = /^my (week|month|\d{4})\s*\/\//i
const SEP_RE = /^[─━-]{10,}$/
const SECTION_RE = /^(🤖|🔥|⚡︎|🧠|📊|💡|⏳)\s*(.+)$/u
const VAULT_LINK_RE = /^👉\s*(.+)$/u
const BRACKET_CTA_RE = /^\[(.+)]$/
const QUOTE_RE = /^"(.*)"$/
const CLUSTER_RE = /^\s*(\d{2})\s*\/\s*(.*)$/
const BULLET_RE = /^(\s*)▪\s?(.*)$/
const DOT_RE = /^(\s*)([●•])\s?(.*)$/
const METRIC_RE = /^([A-Za-z][A-Za-z .]{2,20}):\s*(.*)$/
const DASH_METRIC_RE = /^\s*([a-z][a-z ]{2,20}?)\s+·\s+(.*)$/i
const BOX_TOP_RE = /^┌─.*─┐$/
const BOX_BOTTOM_RE = /^└─+┘$/

export function renderDigestBody(bodyHtml: string): ReactNode[] {
  const lines = bodyHtml.split('\n')
  const blocks: ReactNode[] = []
  let key = 0
  let sawFirstHeader = false
  let spacer = false
  let inBox = false
  let boxHeadline = true
  let boxChildren: ReactNode[] = []

  const closeBox = () => {
    if (inBox) {
      blocks.push(
        <div key={key++} className="digest-box">
          {boxChildren}
        </div>
      )
    }
    inBox = false
    boxHeadline = true
    boxChildren = []
  }

  for (const line of lines) {
    if (BORDER_RE.test(line)) continue
    if (!sawFirstHeader && HEADER_LINE_RE.test(line)) {
      sawFirstHeader = true
      continue
    }
    if (line.trim() === '') {
      spacer = true
      continue
    }

    const applySpacer = spacer && blocks.length > 0
    spacer = false

    if (BOX_TOP_RE.test(line)) {
      closeBox()
      inBox = true
      boxHeadline = true
      continue
    }
    if (BOX_BOTTOM_RE.test(line)) {
      closeBox()
      continue
    }
    if (inBox) {
      const content = line.trim()
      const dashMetric = content.match(DASH_METRIC_RE)
      if (boxHeadline) {
        boxChildren.push(
          <div key={boxChildren.length} className="digest-box-headline"
               dangerouslySetInnerHTML={{ __html: clean(content) }} />
        )
        boxHeadline = false
      } else if (dashMetric) {
        boxChildren.push(
          <div key={boxChildren.length} className="digest-metric">
            <span className="digest-metric-label">{dashMetric[1].trim()}</span>
            <span className="digest-metric-value"
                  dangerouslySetInnerHTML={{ __html: clean(dashMetric[2]) }} />
          </div>
        )
      } else {
        boxChildren.push(
          <div key={boxChildren.length} dangerouslySetInnerHTML={{ __html: clean(content) }} />
        )
      }
      continue
    }

    if (SEP_RE.test(line)) {
      blocks.push(<hr key={key++} className="digest-sep" />)
      continue
    }

    const vaultLink = line.match(VAULT_LINK_RE)
    if (vaultLink) {
      blocks.push(
        <div key={key++} className={`digest-vault-link${applySpacer ? ' digest-mt' : ''}`}
             dangerouslySetInnerHTML={{ __html: clean(vaultLink[1]) }} />
      )
      continue
    }

    const section = line.match(SECTION_RE)
    if (section) {
      blocks.push(
        <div key={key++} className={`digest-section-label${applySpacer ? ' digest-mt' : ''}`}>
          {line.trim()}
        </div>
      )
      continue
    }

    const bracket = line.match(BRACKET_CTA_RE)
    if (bracket) {
      blocks.push(
        <div key={key++} className={`digest-cta-label${applySpacer ? ' digest-mt' : ''}`}>
          {bracket[1]}
        </div>
      )
      continue
    }

    const quote = line.match(QUOTE_RE)
    if (quote) {
      const sentences = quote[1]
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean)
      blocks.push(
        <blockquote key={key++} className="digest-quote">
          {sentences.map((s, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: clean(s) }} />
          ))}
        </blockquote>
      )
      continue
    }

    const cluster = line.match(CLUSTER_RE)
    if (cluster) {
      blocks.push(
        <div key={key++} className={`digest-cluster${applySpacer ? ' digest-mt' : ''}`}>
          <span className="digest-cluster-num">{cluster[1]}</span>
          <span dangerouslySetInnerHTML={{ __html: clean(cluster[2]) }} />
        </div>
      )
      continue
    }

    const bullet = line.match(BULLET_RE)
    if (bullet) {
      const indented = bullet[1].length > 3
      const content = bullet[2]
      const metric = !content.includes('<a') ? content.match(METRIC_RE) : null
      if (metric) {
        blocks.push(
          <div key={key++} className={`digest-metric${indented ? ' digest-indent' : ''}`}>
            <span className="digest-metric-label">{metric[1].trim()}</span>
            <span
              className="digest-metric-value"
              dangerouslySetInnerHTML={{ __html: clean(metric[2]) }}
            />
          </div>
        )
      } else {
        blocks.push(
          <div key={key++} className={`digest-bullet${indented ? ' digest-indent' : ''}`}>
            <span className="digest-bullet-mark">▪</span>
            <span dangerouslySetInnerHTML={{ __html: clean(content) }} />
          </div>
        )
      }
      continue
    }

    const dot = line.match(DOT_RE)
    if (dot) {
      const isSeason = dot[2] === '●'
      blocks.push(
        <div key={key++} className={isSeason ? 'digest-season' : 'digest-season-sentence'}>
          <span dangerouslySetInnerHTML={{ __html: clean(dot[3]) }} />
        </div>
      )
      continue
    }

    const dashMetric = line.match(DASH_METRIC_RE)
    if (dashMetric) {
      blocks.push(
        <div key={key++} className={`digest-metric${applySpacer ? ' digest-mt' : ''}`}>
          <span className="digest-metric-label">{dashMetric[1].trim()}</span>
          <span className="digest-metric-value"
                dangerouslySetInnerHTML={{ __html: clean(dashMetric[2]) }} />
        </div>
      )
      continue
    }

    blocks.push(
      <p
        key={key++}
        className={`digest-line${applySpacer ? ' digest-mt' : ''}`}
        dangerouslySetInnerHTML={{ __html: clean(line) }}
      />
    )
  }

  closeBox()

  return blocks
}
