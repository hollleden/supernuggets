import Link from 'next/link'

// Public landing — replaces the legacy single-user grid that used to live at /.
// Vault access now lives at /u/[token]/, generated and DM'd by the Telegram bot
// on /start. This page is the only thing an anonymous visitor sees.

export const metadata = {
  title: 'SUPERNUGGETS · GET YOUR VAULT',
  description: 'Personal second-brain bot. Message @supernuggetss_bot on Telegram to receive your private vault link.',
}

export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-lg w-full border-2 border-foreground bg-card p-6 md:p-10">
        <pre className="font-mono text-xs md:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
{`SUPERNUGGETS // MAINFRAME v0.6
----------------------------------
PERSONAL SECOND-BRAIN SYSTEM
TELEGRAM INGEST · WEB BROWSE

----------------------------------
ACCESS:
▪ MESSAGE @SUPERNUGGETSS_BOT
▪ SEND /START
▪ RECEIVE YOUR PRIVATE VAULT LINK
▪ BOOKMARK IT · IT IS YOUR KEY

----------------------------------
WHAT THE BOT INGESTS:
▪ TEXT · VOICE · PHOTOS · VIDEOS
▪ TIKTOK · INSTAGRAM · YT SHORTS
▪ TWITTER · REDDIT · ARTICLES

----------------------------------
[QUOTA] 5 SAVES / 24HR CYCLE
[BUGS]  @HOLEDEN`}
        </pre>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="https://t.me/supernuggetss_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-2 border border-foreground bg-foreground text-background hover:bg-background hover:text-foreground transition-colors"
          >
            [ ⬈ OPEN BOT IN TELEGRAM ]
          </Link>
        </div>
      </div>
    </main>
  )
}
