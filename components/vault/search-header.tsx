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
  folderCounts: Record<string, number>
  activeTag: string
  onClearTag: () => void
}

const FOLDER_LABELS: Record<FolderType, string> = {
  all: 'ALL',
  skin: 'SKIN',
  make: 'MAKE',
  food: 'FOOD',
  body: 'BODY',
  learn: 'LEARN',
  work: 'WORK',
  fun: 'FUN',
  go: 'GO',
  mind: 'MIND',
  other: 'OTHER',
}

export function SearchHeader({
  searchQuery,
  onSearchChange,
  selectedFolder,
  onFolderChange,
  totalNuggets,
  filteredNuggets,
  folderCounts,
  activeTag,
  onClearTag,
}: SearchHeaderProps) {
  return (
    <header className="sticky top-0 bg-background z-30 border-b border-foreground">
      {/* Search bar + active-tag chip + nugget count */}
      <div className="p-4 border-b border-foreground">
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar value={searchQuery} onChange={onSearchChange} />

          {/* Active tag chip — appears when user clicks a tag on a card */}
          {activeTag && (
            <div className="flex items-center gap-1 border border-foreground bg-foreground text-background font-mono text-[10px] uppercase tracking-wider px-2 py-[7px] shrink-0">
              <span>#{activeTag}</span>
              <button
                onClick={onClearTag}
                className="ml-1 leading-none hover:opacity-70 transition-opacity"
                aria-label="Clear tag filter"
              >
                ×
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Folder filter tabs. Each chip gets a 2px top accent in folder color.
          Count shown after the label so the user can see which folders have content. */}
      <div className="flex flex-wrap items-stretch">
        {FOLDERS.map((folder) => {
          const isActive = selectedFolder === folder
          const accentColor = FOLDER_COLOR_HEX[folder]
          const count = folder === 'all' ? folderCounts.all : (folderCounts[folder] ?? 0)
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
              {count > 0 && (
                <span className={cn(
                  'ml-1.5 font-mono text-[8px] font-normal',
                  isActive ? 'opacity-60' : 'text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </header>
  )
}
