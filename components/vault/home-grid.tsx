'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchHeader } from '@/components/vault/search-header'
import { MasonryGrid } from '@/components/vault/nugget-card'
import type { Nugget, FolderType } from '@/lib/nuggets'

interface HomeGridProps {
  initialNuggets: Nugget[]
}

// Client island that owns search + folder filter + tag filter state.
// Initial nuggets come from the parent server component, so revalidatePath('/')
// after a server action causes a fresh server fetch on next navigation.
export function HomeGrid({ initialNuggets }: HomeGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const urlFolder = (searchParams.get('folder') ?? 'all') as FolderType
  const urlTag = searchParams.get('tag') ?? ''

  const [selectedFolder, setSelectedFolder] = useState<FolderType>(urlFolder)
  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const [activeTag, setActiveTag] = useState(urlTag)

  // Sync inputs from URL changes (e.g. tag click on a card navs here with ?tag=)
  useEffect(() => setSearchQuery(urlQuery), [urlQuery])
  useEffect(() => setSelectedFolder(urlFolder), [urlFolder])
  useEffect(() => setActiveTag(urlTag), [urlTag])

  // Per-folder nugget counts — used to show "GROW · 12" in the filter bar.
  // Computed from the full unfiltered set so counts don't shift as filters change.
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialNuggets.length }
    for (const n of initialNuggets) {
      counts[n.folder] = (counts[n.folder] ?? 0) + 1
    }
    return counts
  }, [initialNuggets])

  const filteredNuggets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const tag = activeTag.toLowerCase()
    return initialNuggets.filter(n => {
      const matchesFolder = selectedFolder === 'all' || n.folder === selectedFolder
      // Tag filter is exact-match — clicking a tag on a card filters precisely to it.
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
  }, [initialNuggets, selectedFolder, searchQuery, activeTag])

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedFolder('all')
    setActiveTag('')
    if (urlQuery || urlFolder !== 'all' || urlTag) router.replace('/')
  }

  const handleClearTag = () => {
    setActiveTag('')
    // If the tag came from the URL, clean up without blowing away other params.
    if (urlTag) {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (selectedFolder !== 'all') params.set('folder', selectedFolder)
      const qs = params.toString()
      router.replace(qs ? `/?${qs}` : '/')
    }
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
        folderCounts={folderCounts}
        activeTag={activeTag}
        onClearTag={handleClearTag}
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
