import type { ReactNode } from 'react'

// Bot-generated digest text (digest.py) uses a fixed line vocabulary:
// border rows ("////…", "====…", "####…"), separator rows ("────…", "━━━━…"),
// "🤖/🔥/⚡︎/🧠/📊/💡/⏳ label:" section headers, "[bracket]" CTA lines,
// " ▪ label: value" metrics, " ▪ <a>…</a>" links, "  ● SEASON" / "    • sentence"
// year-in-review rows, and quoted "insight" paragraphs. This parses those into
// styled blocks instead of dumping raw pre-wrap text.
const BORDER_RE = /^[/=#]{10,}$/
const HEADER_LINE_RE = /^(weekly digest|monthly digest|\d{4} wrapped)\s*\/\//i
const SEP_RE = /^[─━-]{10,}$/
const SECTION_RE = /^(🤖|🔥|⚡︎|🧠|📊|💡|⏳)\s*(.+)$/u
const BRACKET_CTA_RE = /^\[(.+)]$/
const QUOTE_RE = /^"(.*)"$/
const CLUSTER_RE = /^\s*(\d{2})\s*\/\s*(.*)$/
const BULLET_RE = /^(\s*)▪\s?(.*)$/
const DOT_RE = /^(\s*)([●•])\s?(.*)$/
const METRIC_RE = /^([A-Za-z][A-Za-z .]{2,20}):\s*(.*)$/

export function renderDigestBody(bodyHtml: string): ReactNode[] {
  const lines = bodyHtml.split('\n')
  const blocks: ReactNode[] = []
  let key = 0
  let sawFirstHeader = false
  let spacer = false

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

    if (SEP_RE.test(line)) {
      blocks.push(<hr key={key++} className="digest-sep" />)
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
            <p key={i} dangerouslySetInnerHTML={{ __html: s }} />
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
          <span dangerouslySetInnerHTML={{ __html: cluster[2] }} />
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
              dangerouslySetInnerHTML={{ __html: metric[2] }}
            />
          </div>
        )
      } else {
        blocks.push(
          <div key={key++} className={`digest-bullet${indented ? ' digest-indent' : ''}`}>
            <span className="digest-bullet-mark">▪</span>
            <span dangerouslySetInnerHTML={{ __html: content }} />
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
          <span dangerouslySetInnerHTML={{ __html: dot[3] }} />
        </div>
      )
      continue
    }

    blocks.push(
      <p
        key={key++}
        className={`digest-line${applySpacer ? ' digest-mt' : ''}`}
        dangerouslySetInnerHTML={{ __html: line }}
      />
    )
  }

  return blocks
}
