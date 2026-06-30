import Link from 'next/link'

export const metadata = {
  title: 'supernuggets · your personal vault',
  description:
    'Save anything from Telegram — TikToks, articles, voice notes, screenshots — and browse it all in one place.',
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── TOP BAR ── */}
      <div className="w-full bg-[#FAFF00] dark:bg-neutral-800 border-b border-black dark:border-neutral-700 py-1.5 select-none overflow-hidden">
        <div className="font-mono text-[10px] font-black tracking-wider text-black dark:text-neutral-400 text-center px-4 whitespace-nowrap overflow-hidden text-ellipsis">
          supernuggets — digital vault // brain dump engine — stop cluttering your camera roll — reclaim your creative chaos — captured today, remembered forever
        </div>
      </div>

      {/* ── GRID HERO ── */}
      <section className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-foreground/10 border border-foreground/10">

          {/* ── LEFT: Logo + Headline ── */}
          <div className="bg-card p-8 md:p-12 flex flex-col justify-center min-h-[350px] md:row-span-2">
            <div className="font-mono text-base font-black tracking-tight whitespace-nowrap flex items-center gap-2 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nugget-logo.png" alt="" className="w-36 h-36 shrink-0" style={{ imageRendering: 'pixelated' as React.CSSProperties['imageRendering'] }} />
              <span>supernuggets</span>
            </div>
            <h1 className="font-mono text-3xl sm:text-4xl md:text-[44px] font-extrabold tracking-tight leading-[1.05]">
              Save anything.
              <br />
              Find everything.
            </h1>
            <p className="font-mono text-[13px] text-muted-foreground leading-relaxed mt-4">
              A private vault for everything you want to save.
            </p>
          </div>

          {/* ── RIGHT TOP-LEFT: What it accepts ── */}
          <div className="bg-background p-6 flex flex-col min-h-[175px]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-3">
              01. inbound
            </span>
            <h3 className="font-mono text-base font-extrabold uppercase tracking-tight mb-3">
              Send anything to the bot
            </h3>
            <p className="font-mono text-[13px] text-muted-foreground leading-relaxed">
              Drop a link, text note, photo, or voice memo in Telegram.
            </p>
          </div>

          {/* ── RIGHT TOP-RIGHT: AI processing ── */}
          <div className="bg-card p-6 flex flex-col min-h-[175px]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-3">
              02. ai engine
            </span>
            <h3 className="font-mono text-base font-extrabold uppercase tracking-tight mb-3">
              Zero manual organizing
            </h3>
            <p className="font-mono text-[13px] text-muted-foreground leading-relaxed">
              Transcribed, summarized, fact-checked, and filed automatically.
            </p>
          </div>

          {/* ── RIGHT BOTTOM-LEFT: CTA ── */}
          <Link
            href="https://t.me/supernuggetss_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FAFF00] p-6 flex items-center justify-center min-h-[175px] hover:brightness-95 transition-all"
          >
            <div className="border-2 border-foreground rounded-xl bg-card px-8 py-5 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-mono text-base font-extrabold uppercase tracking-tight">
                ⬈ Open
              </p>
              <p className="font-mono text-base font-extrabold uppercase tracking-tight">
                Supernuggets
              </p>
            </div>
          </Link>

          {/* ── RIGHT BOTTOM-RIGHT: Vault features ── */}
          <div className="bg-background p-6 flex flex-col min-h-[175px]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-3">
              03. your vault
            </span>
            <h3 className="font-mono text-base font-extrabold uppercase tracking-tight mb-3">
              Browse and rediscover
            </h3>
            <p className="font-mono text-[13px] text-muted-foreground leading-relaxed">
              Browse, search, and filter your vault on the web.
            </p>
          </div>
        </div>
      </section>

      {/* ── ABOUT: WHY ── */}
      <section className="px-4 md:px-6 pb-6">
        <div className="border border-foreground/10">

          {/* WHY */}
          <div className="bg-card p-8 md:p-10">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
              02. why
            </span>
            <h3 className="font-mono text-lg font-extrabold uppercase tracking-tight mt-2 mb-3">
              My &quot;saved&quot; folder is a digital graveyard
            </h3>
            <p className="font-mono text-[13px] text-muted-foreground leading-relaxed max-w-xl">
              I create folders for everything and never open them, or just hit
              &quot;like&quot; and dump things into an infinite scroll where they vanish
              forever. TikTok covers never show what&apos;s actually inside. Screenshots
              pile up, links get lost — I&apos;m drowning in digital noise. Supernuggets
              isn&apos;t about &quot;saving.&quot; It&apos;s about finding.
            </p>
          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="max-w-5xl mx-auto px-6 py-5 border-t border-black/[0.06]">
        <div className="flex items-center justify-end gap-5">
          <Link
            href="https://github.com/hollleden/supernuggets"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            ⬈ github
          </Link>
          <Link
            href="https://t.me/holeden"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            ⬈ created by
          </Link>
        </div>
      </footer>
    </main>
  )
}
