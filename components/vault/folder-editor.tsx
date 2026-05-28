'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateNuggetFolder } from '@/app/actions/nuggets'
import { FOLDERS, FOLDER_COLOR_HEX, type FolderType } from '@/lib/nuggets'

interface FolderEditorProps {
  nuggetId: number
  initialFolder: string
  token: string
}

// Boxed dropdown that fully matches the [← BACK] / [⌫ DELETE] button treatment.
// Uses server action (bypasses RLS), then router.refresh re-runs the server page
// so the sticky bar / breadcrumb / accent colors all update at once.
export function FolderEditor({ nuggetId, initialFolder, token }: FolderEditorProps) {
  const router = useRouter()
  const [folder, setFolder] = useState(initialFolder)
  // `saving` gates the select during the async DB call.
  // useTransition's `pending` only flips true after startTransition fires,
  // which is AFTER the await — leaving a window where a second change could race.
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()

  const handleChange = async (next: string) => {
    if (next === folder || saving) return
    const previous = folder
    setFolder(next) // optimistic
    setSaving(true)
    const result = await updateNuggetFolder(token, nuggetId, next)
    setSaving(false)
    if (!result.ok) {
      alert(`[FAIL] DB_WRITE_REJECTED: ${result.error}`)
      setFolder(previous)
      return
    }
    startTransition(() => router.refresh())
  }

  const color = FOLDER_COLOR_HEX[folder as FolderType] ?? FOLDER_COLOR_HEX.all

  return (
    <span className="relative inline-flex items-center">
      <select
        value={folder}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="font-mono text-[10px] font-bold uppercase tracking-wider bg-card border border-foreground px-2 py-1 pr-7 cursor-pointer appearance-none rounded-none focus:outline-none focus:ring-1 focus:ring-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
        style={{ color }}
      >
        {FOLDERS.filter(f => f !== 'all').map(f => (
          <option key={f} value={f} className="font-mono">{f}</option>
        ))}
      </select>
      <span
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none font-mono text-[10px]"
        style={{ color }}
        aria-hidden
      >
        ▾
      </span>
    </span>
  )
}
