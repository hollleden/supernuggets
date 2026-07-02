import Link from 'next/link'
import { TelegramLogin } from './telegram-login'

export const metadata = {
  title: 'supernuggets · your personal vault',
  description:
    'Save anything from Telegram — TikToks, articles, voice notes, screenshots — and browse it all in one place.',
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── TOP BAR ── */}
      <div className="w-full bg-[#FAFF00] border-b border-black py-1.5 select-none overflow-hidden">
        <div className="flex w-max animate-marquee whitespace-nowrap">
          <span className="font-mono text-[12px] font-black tracking-wider text-black px-4">
            × IT IS LITERALLY SO SATISFYING — WATCHING EVERY PIECE OF CONTENT YOU LIKE
            ACCURATELY AND AUTOMATICALLY INDEXED INTO PERFECT DIRECTORIES ✦ ALL YOUR
            BEST NUGGETS DISCOVERABLE AT ANY TIME × CAPTURED TODAY, REMEMBERED FOREVER ×
          </span>
          <span
            className="font-mono text-[12px] font-black tracking-wider text-black px-4"
            aria-hidden="true"
          >
            × IT IS LITERALLY SO SATISFYING — WATCHING EVERY PIECE OF CONTENT YOU LIKE
            ACCURATELY AND AUTOMATICALLY INDEXED INTO PERFECT DIRECTORIES ✦ ALL YOUR
            BEST NUGGETS DISCOVERABLE AT ANY TIME × CAPTURED TODAY, REMEMBERED FOREVER ×
          </span>
        </div>
      </div>

      {/* ── GRID HERO ── */}
      <section className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr] gap-3">

          {/* ── COL 1: Logo + Headline ── */}
          <div className="group bg-[#F5F3EF] border border-black/10 rounded-[12px] p-6 md:p-8 flex flex-col justify-center min-h-[260px] md:row-span-2 transition-colors hover:bg-white">
            <div className="font-mono text-base font-black tracking-tight whitespace-nowrap flex items-center gap-2 mb-6 text-[#1A1A1A]">
              <div className="nugget-container relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nugget-logo-pixel.png"
                  alt="supernuggets"
                  width={32}
                  height={34}
                  className="nugget-avatar w-32 h-auto shrink-0"
                  style={{ imageRendering: 'pixelated' as React.CSSProperties['imageRendering'] }}
                />
                <svg className="pixel-star star-1" viewBox="0 0 7 7" fill="none" aria-hidden="true">
                  <path d="M3 0h1v1H3V0zm0 6h1v1H3V6zM0 3h1v1H0V3zm6 0h1v1H6V3zm-2 0h-1v1h1V3zm0-1h-1v1h1V2zm0 2h-1v1h1V4zm1-1h-1v1h1V3zm-3 0h-1v1h1V3z" fill="#000"/>
                  <path d="M3 1h1v1H3V1zm0 4h1v1H3V5zM1 3h1v1H1V3zm4 0h1v1H5V3zm-2 0h1v1H3V3zm0-1h1v1H3V2zm0 2h1v1H3V4z" fill="#FAFF00"/>
                </svg>
                <svg className="pixel-star star-2" viewBox="0 0 7 7" fill="none" aria-hidden="true">
                  <path d="M3 0h1v1H3V0zm0 6h1v1H3V6zM0 3h1v1H0V3zm6 0h1v1H6V3zm-2 0h-1v1h1V3zm0-1h-1v1h1V2zm0 2h-1v1h1V4zm1-1h-1v1h1V3zm-3 0h-1v1h1V3z" fill="#000"/>
                  <path d="M3 1h1v1H3V1zm0 4h1v1H3V5zM1 3h1v1H1V3zm4 0h1v1H5V3zm-2 0h1v1H3V3zm0-1h1v1H3V2zm0 2h1v1H3V4z" fill="#FAFF00"/>
                </svg>
                <svg className="pixel-star star-3" viewBox="0 0 7 7" fill="none" aria-hidden="true">
                  <path d="M3 0h1v1H3V0zm0 6h1v1H3V6zM0 3h1v1H0V3zm6 0h1v1H6V3zm-2 0h-1v1h1V3zm0-1h-1v1h1V2zm0 2h-1v1h1V4zm1-1h-1v1h1V3zm-3 0h-1v1h1V3z" fill="#000"/>
                  <path d="M3 1h1v1H3V1zm0 4h1v1H3V5zM1 3h1v1H1V3zm4 0h1v1H5V3zm-2 0h1v1H3V3zm0-1h1v1H3V2zm0 2h1v1H3V4z" fill="#FAFF00"/>
                </svg>
              </div>
              <span>supernuggets</span>
            </div>
            <h1 className="font-mono text-3xl sm:text-4xl md:text-[26px] lg:text-[36px] font-extrabold uppercase tracking-tight leading-[1.05] text-[#1A1A1A]">
              Save anything.
              <br />
              Find everything.
            </h1>
            <p className="font-mono text-[15px] text-[#4A4538] leading-relaxed mt-4">
              Think of the bot as your personal AI chef. You dump in your raw, chaotic
              digital clutter—voice notes, links, articles, or galleries—and it instantly
              deep-fries everything into crispy, perfect little info nuggets.
            </p>
          </div>

          {/* ── COL 2, ROW 1: Step 1 ── */}
          <div className="bg-[#F5F3EF] border border-black/10 rounded-[12px] p-6 flex flex-col min-h-[140px] transition-colors hover:bg-white">
            <h3 className="font-mono text-base font-extrabold uppercase tracking-tight mb-3 text-[#1A1A1A]">
              1. You send it to the bot
            </h3>
            <p className="font-mono text-[15px] text-[#4A4538] leading-relaxed">
              TikToks, articles, voice notes, images and galleries or just random
              thoughts. Whatever it is, just dump it directly into the Telegram bot.
            </p>
          </div>

          {/* ── COL 3, ROW 1: Step 2 ── */}
          <div className="bg-[#F5F3EF] border border-black/10 rounded-[12px] p-6 flex flex-col min-h-[140px] transition-colors hover:bg-white">
            <h3 className="font-mono text-base font-extrabold uppercase tracking-tight mb-3 text-[#1A1A1A]">
              2. The AI does the actual work
            </h3>
            <p className="font-mono text-[15px] text-[#4A4538] leading-relaxed">
              It downloads it, enriches it, and files it away neatly while you go do
              literally anything else.
            </p>
          </div>

          {/* ── COL 2, ROW 2: Step 3 ── */}
          <div className="bg-[#F5F3EF] border border-black/10 rounded-[12px] p-6 flex flex-col min-h-[140px] transition-colors hover:bg-white">
            <h3 className="font-mono text-base font-extrabold uppercase tracking-tight mb-3 text-[#1A1A1A]">
              3. And then you can actually find it again
            </h3>
            <p className="font-mono text-[15px] text-[#4A4538] leading-relaxed">
              It&apos;s your own little vault — browse it, search it, edit it, fall back
              into it at 2am like I do. It&apos;s just sitting there waiting for you.
            </p>
          </div>

          {/* ── COL 3, ROW 2: control panel stack ── */}
          <div className="flex flex-col gap-2">

            {/* PRIMARY: black launch card */}
            <Link
              href="https://t.me/supernuggetss_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="group cta-brutal-btn flex items-center justify-center min-h-[140px] rounded-[12px] border-2 border-black bg-black text-center"
            >
              <span className="font-mono text-base font-extrabold uppercase tracking-tight text-white leading-snug">
                LAUNCH IN TELEGRAM&nbsp;↗
              </span>
            </Link>

            {/* GHOST: login button — transparent, sharp corners, TelegramLogin overlaid */}
            <div className="relative flex items-center justify-center rounded-none border border-black/30 bg-transparent px-6 py-3 dark:border-[#666666]">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#666666] pointer-events-none select-none">
                [ Log in to existing vault ]
              </span>
              <div className="absolute inset-0 opacity-0 cursor-pointer">
                <TelegramLogin />
              </div>
            </div>

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
                <p className="font-mono text-[15px] text-muted-foreground leading-[1.8] tracking-[0.01em] mt-2">
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
                <p className="font-mono text-[15px] text-muted-foreground leading-[1.8] tracking-[0.01em] mt-2">
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
                <p className="font-mono text-[15px] text-muted-foreground leading-[1.8] tracking-[0.01em] mt-2">
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
                <p className="font-mono text-[15px] text-muted-foreground leading-[1.8] tracking-[0.01em] mt-2">
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
          <span className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nugget-pile-pixel.png"
              alt=""
              aria-hidden="true"
              width={64}
              height={38}
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none"
              style={{ bottom: '5px', width: '84px', height: 'auto', imageRendering: 'pixelated' as React.CSSProperties['imageRendering'] }}
            />
            <Link
              href="https://t.me/holeden"
              target="_blank"
              rel="noopener noreferrer"
              className="relative font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              ⬈ created by
            </Link>
          </span>
        </div>
      </footer>
    </main>
  )
}
