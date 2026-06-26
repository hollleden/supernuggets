import Link from 'next/link'
import { TelegramLogin } from './telegram-login'

export const metadata = {
  title: 'supernuggets · your personal vault',
  description:
    'Save anything from Telegram — TikToks, articles, voice notes, screenshots — and browse it all in one place.',
}

const FOLDERS = [
  { name: 'skin', color: '#D43A6A' },
  { name: 'make', color: '#E89890' },
  { name: 'food', color: '#E04A2A' },
  { name: 'body', color: '#4D8C5D' },
  { name: 'learn', color: '#5DA17F' },
  { name: 'work', color: '#2A4FCC' },
  { name: 'fun', color: '#B83A8C' },
  { name: 'go', color: '#7AAFD4' },
  { name: 'mind', color: '#6B4A8C' },
  { name: 'other', color: '#847E6E' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* ── HERO ── */}
      <section className="flex flex-col items-center justify-center px-4 pt-16 pb-12 md:pt-24 md:pb-16">
        <h1 className="font-mono text-2xl md:text-4xl font-extrabold uppercase tracking-tight text-foreground text-center">
          SUPERNUGGETS
        </h1>
        <p className="font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">
          personal vault system // v1.0
        </p>

        <div className="mt-8 max-w-md w-full border-2 border-foreground bg-card p-6 md:p-8">
          <p className="font-mono text-xs md:text-sm text-foreground leading-relaxed">
            Save anything you find online — TikToks, Instagram reels, articles,
            voice notes, screenshots, recipes. The bot downloads, transcribes,
            summarizes, fact-checks, and files everything into your private vault.
          </p>
          <p className="font-mono text-xs md:text-sm text-foreground leading-relaxed mt-4">
            Browse, search, and rediscover it all here.
          </p>
        </div>

        {/* ── LOGIN + CTA ── */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <TelegramLogin />

          <Link
            href="https://t.me/supernuggetss_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            new here? open bot in telegram
          </Link>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="flex justify-center">
        <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
          ────────────────────────────────────
        </span>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <h2 className="font-mono text-sm md:text-base font-extrabold uppercase tracking-tight text-foreground mb-8 text-center">
          HOW IT WORKS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'SEND',
              desc: 'Forward a TikTok, paste an article link, snap a screenshot, record a voice note — send anything to the bot on Telegram.',
            },
            {
              step: '02',
              title: 'PROCESS',
              desc: 'The bot downloads media, transcribes audio, extracts text from images, summarizes, fact-checks, and auto-files into 10 folders.',
            },
            {
              step: '03',
              title: 'BROWSE',
              desc: 'Open your vault here. Filter by folder or tag, search across everything, rediscover what you saved weeks ago.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="border border-foreground bg-card p-5 transition-all duration-150 hover:border-2 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                STEP {item.step}
              </span>
              <h3 className="font-mono text-sm font-extrabold uppercase tracking-tight text-foreground mt-2">
                {item.title}
              </h3>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-2">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="flex justify-center">
        <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
          ────────────────────────────────────
        </span>
      </div>

      {/* ── WHAT IT HANDLES ── */}
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <h2 className="font-mono text-sm md:text-base font-extrabold uppercase tracking-tight text-foreground mb-8 text-center">
          ACCEPTED INBOUND DATA
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            'TikTok videos',
            'Instagram reels',
            'YouTube Shorts',
            'Twitter / X',
            'Web articles',
            'Voice notes',
            'Screenshots',
            'Photo albums',
          ].map((item) => (
            <div
              key={item}
              className="border border-foreground/20 bg-card px-3 py-2 text-center"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
                {item}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="flex justify-center">
        <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
          ────────────────────────────────────
        </span>
      </div>

      {/* ── FOLDERS ── */}
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <h2 className="font-mono text-sm md:text-base font-extrabold uppercase tracking-tight text-foreground mb-2 text-center">
          10-FOLDER TAXONOMY
        </h2>
        <p className="font-mono text-[10px] text-muted-foreground tracking-wider text-center mb-8">
          AUTO-CLASSIFIED BY AI // NO MANUAL SORTING
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {FOLDERS.map((f) => (
            <span
              key={f.name}
              className="font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border"
              style={{ borderColor: f.color, color: f.color }}
            >
              {f.name}
            </span>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="flex justify-center">
        <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
          ────────────────────────────────────
        </span>
      </div>

      {/* ── SAMPLE RECEIPT ── */}
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <h2 className="font-mono text-sm md:text-base font-extrabold uppercase tracking-tight text-foreground mb-8 text-center">
          SAMPLE VAULT RECEIPT
        </h2>

        <div className="max-w-md mx-auto border-2 border-foreground bg-card p-5">
          <pre className="font-mono text-[11px] text-foreground leading-relaxed whitespace-pre-wrap">
{`[FOOD] FERMENTED GARLIC HONEY
--------------------
SUMMARY
• Black garlic honey takes 4-6 weeks
• Natural fermentation preserves cloves
• Use raw unfiltered honey for enzymes
• Flip jar daily for first 2 weeks
--------------------
MENTIONED
• Sandor Katz — Wild Fermentation
--------------------
FACT-CHECK
✓ Botulism risk — garlic in honey is
  safe above pH 4.6 if fermented
--------------------
TAGS
#food #fermentation #preservation`}
          </pre>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-foreground/20 py-8 mt-4">
        <div className="max-w-3xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            SUPERNUGGETS // VAULT SYSTEM
          </span>
          <div className="flex gap-6">
            <Link
              href="https://t.me/supernuggetss_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              TELEGRAM BOT
            </Link>
            <Link
              href="https://t.me/holeden"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              CONTACT
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
