'use client'

import { useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { MasonryGrid } from '@/components/vault/nugget-card'
import { useVaultStats } from '@/lib/vault-stats-context'
import type { Nugget, FolderType } from '@/lib/nuggets'

interface HomeGridProps {
  initialNuggets: Nugget[]
}

function HomeGridInner({ initialNuggets }: HomeGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams<{ token?: string }>()
  const tokenPrefix = params?.token ? `/u/${params.token}` : ''
  const homeHref = tokenPrefix || '/'
  const { setVaultStats } = useVaultStats()

  const urlQuery = searchParams.get('q') ?? ''
  const urlFolder = (searchParams.get('folder') ?? 'all') as FolderType
  const urlTag = searchParams.get('tag') ?? ''

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialNuggets.length }
    for (const n of initialNuggets) {
      counts[n.folder] = (counts[n.folder] ?? 0) + 1
    }
    return counts
  }, [initialNuggets])

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const n of initialNuggets) {
      for (const t of n.tags) {
        const tag = t.toLowerCase()
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }
    return counts
  }, [initialNuggets])

  const filteredNuggets = useMemo(() => {
    const q = urlQuery.toLowerCase().trim()
    const tag = urlTag.toLowerCase()
    return initialNuggets.filter(n => {
      const matchesFolder = urlFolder === 'all' || n.folder === urlFolder
      const matchesTag = !tag || n.tags.some(t => t.toLowerCase() === tag)
      if (!q) return matchesFolder && matchesTag
      const matchesSearch =
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.summaryBullets.some(b => b.toLowerCase().includes(q)) ||
        n.tags.some(t => t.toLowerCase().includes(q)) ||
        n.folder.toLowerCase().includes(q)
      return matchesFolder && matchesTag && matchesSearch
    })
  }, [initialNuggets, urlFolder, urlQuery, urlTag])

  // Publish live counts to context — header and sidebar consume these
  useEffect(() => {
    setVaultStats(initialNuggets.length, filteredNuggets.length, folderCounts, tagCounts)
  }, [initialNuggets.length, filteredNuggets.length, folderCounts, tagCounts, setVaultStats])

  const handleClearTag = () => {
    const sp = new URLSearchParams(searchParams.toString())
    sp.delete('tag')
    const qs = sp.toString()
    router.replace(qs ? `${homeHref}?${qs}` : homeHref)
  }

  const handleClearFilters = () => {
    router.replace(homeHref)
  }

  return (
    <>
      {urlTag && (
        <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-wider px-2 py-1.5 rounded-full">
            <span>#{urlTag}</span>
            <button
              onClick={handleClearTag}
              className="ml-1 leading-none hover:opacity-70 transition-opacity"
              aria-label="Clear tag filter"
            >
              ×
            </button>
          </div>
          {filteredNuggets.length !== initialNuggets.length && (
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              {filteredNuggets.length} OF {initialNuggets.length}
            </span>
          )}
        </div>
      )}

      <section className="flex-1 p-4 md:p-6">
        <MasonryGrid
          nuggets={filteredNuggets}
          hideFolder={urlFolder !== 'all'}
          onClearFilters={handleClearFilters}
        />
      </section>
    </>
  )
}

export function HomeGrid({ initialNuggets }: HomeGridProps) {
  return (
    <Suspense fallback={
      <div className="p-6 font-mono text-xs text-muted-foreground uppercase tracking-wider">
        LOADING VAULT...
      </div>
    }>
      <HomeGridInner initialNuggets={initialNuggets} />
    </Suspense>
  )
}
