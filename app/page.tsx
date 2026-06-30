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
        <div className="flex w-max animate-marquee whitespace-nowrap">
          <span className="font-mono text-[12px] font-black tracking-wider text-black dark:text-neutral-400 px-4">
            supernuggets — the vault where my saves actually work — dump your brain into
            it, I&apos;m not kidding — stop hoarding stuff in your camera roll like a
            raccoon — your chaos, but finally findable — captured today, found in two
            seconds flat
          </span>
          <span
            className="font-mono text-[12px] font-black tracking-wider text-black dark:text-neutral-400 px-4"
            aria-hidden="true"
          >
            supernuggets — the vault where my saves actually work — dump your brain into
            it, I&apos;m not kidding — stop hoarding stuff in your camera roll like a
            raccoon — your chaos, but finally findable — captured today, found in two
            seconds flat
          </span>
        </div>
      </div>

      {/* ── GRID HERO ── */}
      <section className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* ── COL 1: Logo + Headline (spans both rows) ── */}
          <div className="bg-card border border-foreground/10 rounded-[12px] p-6 md:p-8 flex flex-col justify-center min-h-[260px] md:row-span-2">
            <div className="font-mono text-base font-black tracking-tight whitespace-nowrap flex items-center gap-2 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nugget-logo.png" alt="" className="w-36 h-36 shrink-0" style={{ imageRendering: 'pixelated' as React.CSSProperties['imageRendering'] }} />
              <span>supernuggets</span>
            </div>
            <h1 className="font-mono text-3xl sm:text-4xl md:text-[36px] font-extrabold uppercase tracking-tight leading-[1.05]">
              Save anything.
              <br />
              Find everything.
            </h1>
            <p className="font-mono text-[15px] text-muted-foreground leading-relaxed mt-4">
              So you send it to the bot, and then it just... shows up in the app.
              That&apos;s genuinely the whole thing.
            </p>
          </div>

          {/* ── COL 2, ROW 1: Step 1 ── */}
          <div className="bg-background border border-foreground/10 rounded-[12px] p-6 flex flex-col min-h-[140px]">
            <h3 className="font-mono text-base font-extrabold uppercase tracking-tight mb-3">
              1. You send it to the bot
            </h3>
            <p className="font-mono text-[15px] text-muted-foreground leading-relaxed">
              Text, photo, voice note, a TikTok you&apos;re obsessed with, whatever — not
              every link works but most do, I promise, just throw it at the bot in
              Telegram.
            </p>
          </div>

          {/* ── COL 3, ROW 1: CTA ── */}
          <Link
            href="https://t.me/supernuggetss_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FAFF00] border border-foreground/10 rounded-[12px] p-6 flex items-center justify-center min-h-[140px] hover:brightness-95 transition-all group"
          >
            <div className="border-2 border-foreground rounded-[12px] bg-card px-6 py-4 text-center shadow-none transition-shadow group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-mono text-base font-extrabold uppercase tracking-tight">
                ⬈ Open
              </p>
              <p className="font-mono text-base font-extrabold uppercase tracking-tight">
                Supernuggets
              </p>
            </div>
          </Link>

          {/* ── COL 2, ROW 2: Step 2 ── */}
          <div className="bg-card border border-foreground/10 rounded-[12px] p-6 flex flex-col min-h-[140px]">
            <h3 className="font-mono text-base font-extrabold uppercase tracking-tight mb-3">
              2. The AI does the actual work
            </h3>
            <p className="font-mono text-[15px] text-muted-foreground leading-relaxed">
              It downloads it, enriches it, and files it away neatly while you go do
              literally anything else.
            </p>
          </div>

          {/* ── COL 3, ROW 2: Step 3 ── */}
          <div className="bg-background border border-foreground/10 rounded-[12px] p-6 flex flex-col min-h-[140px]">
            <h3 className="font-mono text-base font-extrabold uppercase tracking-tight mb-3">
              3. And then you can actually find it again
            </h3>
            <p className="font-mono text-[15px] text-muted-foreground leading-relaxed">
              It&apos;s your own little vault — browse it, search it, edit it, fall back
              into it at 2am like I do. It&apos;s just sitting there waiting for you.
            </p>
          </div>
        </div>
      </section>

      {/* ── ABOUT: WHY ── */}
      <section className="px-4 md:px-6 pb-6">
        <div className="border border-foreground/10 rounded-[12px] overflow-hidden">

          {/* WHY */}
          <div className="bg-card p-8 md:p-10">
            <span className="font-mono text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
              why
            </span>
            <h3 className="font-mono text-lg font-extrabold uppercase tracking-tight mt-2 mb-6">
              My &quot;saved&quot; folder and I are no longer friends
            </h3>

            <div className="max-w-xl space-y-5">
              <div className="border-t border-foreground/10 pt-3">
                <p className="font-mono text-[15px] text-muted-foreground leading-relaxed mt-2">
                  So I&apos;m on TikTok like, unhealthily often, and I save
                  EVERYTHING — into folders, because I&apos;m that unhinged about
                  organizing — and it does NOTHING for me. I never open the folders.
                  Never. Sometimes I don&apos;t even file it right, I just hit like and
                  call it a day, or — and this is the embarrassing part — I&apos;m too
                  lazy to even pick a folder so it just goes into the abyss that is my
                  general saved feed, gone, forever, never to be seen again, and can we
                  talk about how the TikTok cover image is NEVER what&apos;s actually in
                  the video? Like why. Why would you do that to me.
                </p>
              </div>

              <div className="border-t border-foreground/10 pt-3">
                <p className="font-mono text-[15px] text-muted-foreground leading-relaxed mt-2">
                  And okay, even when I do remember something and I go back to find it,
                  the creator said the name of the cafe for like half a second in tiny
                  white text at the bottom of the screen, and now I&apos;m pausing,
                  I&apos;m rewinding, I&apos;m squinting like I&apos;m reading ancient
                  scripture, and honestly? Sometimes they just say it out loud and I
                  still don&apos;t write it down because googling things is apparently
                  above my pay grade. And this isn&apos;t even just a TikTok thing, you
                  guys, this is everything, this is the whole internet doing this to me.
                </p>
              </div>

              <div className="border-t border-foreground/10 pt-3">
                <p className="font-mono text-[15px] text-muted-foreground leading-relaxed mt-2">
                  So anyway, I got so fed up I built Supernuggets. It started small —
                  just a Telegram bot you could send a TikTok to, and it would grab the
                  important stuff out of it for you — and then I was like, wait, why am
                  I only doing this for TikToks? So I kept adding stuff: screenshots,
                  voice notes, random links, just text, whatever, all straight through
                  Telegram. And eventually I built an actual web app on top of it, so now
                  everything — every post, every idea, every screenshot, every TikTok
                  from literally anywhere — lives in Supernuggets, and I can find it in
                  like two seconds and send it to a friend.
                </p>
              </div>

              <div className="border-t border-foreground/10 pt-3">
                <p className="font-mono text-[15px] text-muted-foreground leading-relaxed mt-2">
                  And I have proof Supernuggets actually works, okay. So a few weeks ago
                  I&apos;m in a store and I remember there was a TikTok about this face
                  serum everyone was losing their minds over, and obviously I have no
                  idea which TikTok, no idea when I saved it, classic me — so I open my
                  Supernuggets vault, I search the name of the store, and boom,
                  there&apos;s the post, there&apos;s the serum name, thirty seconds,
                  done. And that&apos;s the moment I was like, oh my god, it actually
                  works. My saves are no longer a graveyard. They&apos;re alive.
                </p>
              </div>
            </div>
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
            className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            ⬈ github
          </Link>
          <Link
            href="https://t.me/holeden"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            ⬈ created by
          </Link>
        </div>
      </footer>
    </main>
  )
}
