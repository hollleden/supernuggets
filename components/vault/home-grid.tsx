'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchHeader } from '@/components/vault/search-header'
import { MasonryGrid } from '@/components/vault/nugget-card'
import type { Nugget, FolderType } from '@/lib/nuggets'

interface HomeGridProps {
  initialNuggets: Nugget[]
}

// Client island that owns search + folder filter state. Initial nuggets come
// from the parent server component, so revalidatePath('/') after a server
// action causes a fresh server fetch on next navigation.
export function HomeGrid({ initialNuggets }: HomeGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const urlFolder = (searchParams.get('folder') ?? 'all') as FolderType

  const [selectedFolder, setSelectedFolder] = useState<FolderType>(urlFolder)
  const [searchQuery, setSearchQuery] = useState(urlQuery)

  // Sync inputs from URL changes (e.g. tag click on a detail page navs here with ?q=)
  useEffect(() => setSearchQuery(urlQuery), [urlQuery])
  useEffect(() => setSelectedFolder(urlFolder), [urlFolder])

  const filteredNuggets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return initialNuggets.filter(n => {
      const matchesFolder = selectedFolder === 'all' || n.folder === selectedFolder
      if (!q) return matchesFolder
      const matchesSearch =
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.summaryBullets.some(b => b.toLowerCase().includes(q)) ||
        n.tags.some(t => t.toLowerCase().includes(q)) ||
        n.folder.toLowerCase().includes(q)
      return matchesFolder && matchesSearch
    })
  }, [initialNuggets, selectedFolder, searchQuery])

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedFolder('all')
    if (urlQuery || urlFolder !== 'all') router.replace('/')
  }

  return (
    <>
      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFolder={selectedFolder}
        onFolderChange={setSelectedFolder}
        totalNuggets={initialNuggets.length}
        filteredNuggets={filteredNuggets.length}
      />

      <section className="flex-1 p-4">
        <MasonryGrid
          nuggets={filteredNuggets}
          hideFolder={selectedFolder !== 'all'}
          onClearFilters={handleClearFilters}
        />
      </section>
    </>
  )
}
