import { notFound } from 'next/navigation'
import { userIdFromToken } from '@/lib/users'
import { AppShell } from '@/components/vault/app-shell'

/**
 * Per-token layout. Validates the token once at the layout level so an invalid
 * token short-circuits to 404 instead of falling through to an empty grid.
 * Child pages re-resolve the user_id (cheap — server-side, on the same request).
 */
export default async function TokenLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const userId = await userIdFromToken(token)
  if (userId == null) notFound()
  return <AppShell>{children}</AppShell>
}
