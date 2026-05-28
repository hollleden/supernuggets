import { redirect } from 'next/navigation'

// Legacy stats route — moved to /u/[token]/stats.
export default function LegacyStatsPage() {
  redirect('/')
}
