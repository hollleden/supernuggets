'use client'

import { HeartIcon, PlaneIcon } from './pixel-icons'
import { FolderEditor } from './folder-editor'
import { DeleteButton } from './delete-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

function formatDateNewspaper(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return `${MONTHS[month - 1]} ${String(day).padStart(2, '0')}, ${year}`
}

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" className="font-mono text-[10px] font-bold tracking-widest uppercase rounded-none px-2 py-1">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

interface Props {
  nuggetId: number
  token: string
  folder: string
  date: string
}

export function NuggetMetaBar({ nuggetId, token, folder, date }: Props) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between py-2 mb-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-neutral-500">
          {formatDateNewspaper(date)}
        </span>
        <div className="flex items-center gap-2">
          <Tip label="Favourites">
            <button className="w-11 h-11 flex items-center justify-center rounded-[4px] border border-black/15 dark:border-white/10 hover:bg-foreground hover:text-background transition-colors text-foreground/40">
              <HeartIcon size={14} />
            </button>
          </Tip>
          <Tip label="Share">
            <button className="w-11 h-11 flex items-center justify-center rounded-[4px] border border-black/15 dark:border-white/10 hover:bg-foreground hover:text-background transition-colors text-foreground/40">
              <PlaneIcon size={14} />
            </button>
          </Tip>
          <Tip label="Folder">
            <FolderEditor nuggetId={nuggetId} initialFolder={folder} token={token} />
          </Tip>
          <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" aria-hidden />
          <Tip label="Delete">
            <DeleteButton nuggetId={nuggetId} token={token} variant="icon" />
          </Tip>
        </div>
      </div>
    </TooltipProvider>
  )
}
