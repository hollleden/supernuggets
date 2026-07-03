import Link from 'next/link'

export const metadata = {
  title: 'supernuggets · privacy policy',
  description: 'How supernuggets stores and uses your data.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-14">
        <Link
          href="/"
          className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          ⬈ back
        </Link>

        <h1 className="font-mono text-2xl font-black uppercase tracking-tight mt-6 mb-1">
          Privacy Policy
        </h1>
        <p className="font-mono text-[11px] text-muted-foreground/60 mb-10">
          Last updated: 2026-07-03
        </p>

        <div className="space-y-8 font-mono text-sm leading-relaxed">
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2">
              What supernuggets is
            </h2>
            <p>
              supernuggets is a private, personal vault. You send content to
              the Telegram bot (@supernuggetss_bot) — text, images, videos,
              voice notes, or URLs — and it&apos;s processed, tagged, and
              saved for you at a personal link. Nothing you save is public
              or visible to other users. There is no feed, no sharing, no
              discovery of other people&apos;s content.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2">
              What we store
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>The content you send (text, transcripts, image/video metadata, and thumbnails)</li>
              <li>Your Telegram user ID, used to keep your vault separate from everyone else&apos;s</li>
              <li>Your timezone, if you share it, used only to time your digest emails</li>
              <li>Basic usage data (when entries were saved) used for digest summaries and daily limits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2">
              How it&apos;s processed
            </h2>
            <p>
              What you send is passed to AI providers (Anthropic, and
              OpenAI for voice/video transcription) to generate a summary,
              tags, and fact-checks. This processing happens automatically
              on save — it is not reviewed by a person, and the output is
              stored alongside your original content in your vault.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2">
              Who can see it
            </h2>
            <p>
              Only you. Your vault is reachable only via a private,
              unguessable link tied to your account. Database-level access
              controls (Row Level Security) enforce that your data can only
              be read or written through your own link.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2">
              Deleting your data
            </h2>
            <p>
              You can delete any individual entry directly from the bot or
              the web vault at any time. To delete your entire account and
              all stored content, message the bot owner directly.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2">
              Telegram platform data
            </h2>
            <p>
              Telegram itself also processes data whenever you use the bot,
              covered separately by Telegram&apos;s own{' '}
              <a
                href="https://telegram.org/privacy-tpa"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Privacy Policy for Bots and Mini Apps
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2">
              Questions
            </h2>
            <p>
              Reach out via{' '}
              <a
                href="https://t.me/holeden"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Telegram
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
