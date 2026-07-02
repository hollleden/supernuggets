import type { Metadata } from 'next'
import { AppShell } from '@/components/vault/app-shell'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  return {
    manifest: `/u/${token}/manifest.webmanifest`,
  }
}

export default function TokenLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
