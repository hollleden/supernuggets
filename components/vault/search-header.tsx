'use client'

import { SearchBar } from '@/components/vault/search-bar'
import { cn } from '@/lib/utils'
import type { FolderType } from '@/lib/nuggets'
import { FOLDERS, FOLDER_COLOR_HEX } from '@/lib/nuggets'

interface SearchHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedFolder: FolderType
  onFolderChange: (folder: FolderType) => void
  totalNuggets: number
  filteredNuggets: number
}

const FOLDER_LABELS: Record<FolderType, string> = {
  all: 'ALL',
  Grow: 'GROW',
  Leisure: 'LEISURE',
  Health: 'HEALTH',
  Creativity: 'CREATIVITY',
  Money: 'MONEY',
  Work: 'WORK',
  Curation: 'CURATION',
  Personal: 'PERSONAL',
  Beauty: 'BEAUTY',
  Food: 'FOOD',
  Travel: 'TRAVEL',
  Sport: 'SPORT',
}

export function SearchHeader({
  searchQuery,
  onSearchChange,
  selectedFolder,
  onFolderChange,
  totalNuggets,
  filteredNuggets,
}: SearchHeaderProps) {
  return (
    <header className="sticky top-0 bg-background z-30 border-b border-foreground">
      {/* Search bar */}
      <div className="p-4 border-b border-foreground">
        <div className="flex items-center gap-4">
          <SearchBar value={searchQuery} onChange={onSearchChange} />
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-foreground px-3 py-2 bg-card">
            {filteredNuggets === totalNuggets
              ? `${totalNuggets} NUGGETS`
              : `${filteredNuggets}/${totalNuggets} FILTERED`}
          </div>
        </div>
      </div>

      {/* Folder filter tabs — manilla style. Each chip gets a 2px top accent in folder color. */}
      <div className="flex flex-wrap items-stretch">
        {FOLDERS.map((folder) => {
          const isActive = selectedFolder === folder
          const accentColor = FOLDER_COLOR_HEX[folder]
          return (
            <button
              key={folder}
              onClick={() => onFolderChange(folder)}
              className={cn(
                'relative px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap',
                'border-r border-b border-foreground border-t-2',
                'transition-colors duration-100',
                isActive
                  ? 'bg-foreground text-background font-bold'
                  : 'bg-card text-foreground hover:bg-muted font-bold'
              )}
              style={{ borderTopColor: accentColor }}
            >
              {FOLDER_LABELS[folder]}
            </button>
          )
        })}
      </div>
    </header>
  )
}
