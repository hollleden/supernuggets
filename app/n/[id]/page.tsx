import { redirect } from 'next/navigation'

// Legacy single-user route — vault data moved under /u/[token]/. Old OPEN
// buttons in the bot's pre-Phase-C receipts still point here; we bounce them
// to the public landing where the user can re-fetch their magic URL.
export default function LegacyNuggetPage() {
  redirect('/')
}
