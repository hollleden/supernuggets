'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'
import { updateNuggetTags } from '@/app/actions/nuggets'

interface TagEditorProps {
  nuggetId: number
  initialTags: string[]
  token: string
}

// Editable tag list. Click X to remove a tag. Type into the +TAG input + Enter to add.
// Server-action backed so writes actually persist (anon RLS would otherwise drop them).
export function TagEditor({ nuggetId, initialTags, token }: TagEditorProps) {
  const router = useRouter()
  const [tags, setTags] = useState<string[]>(initialTags)
  const [draft, setDraft] = useState('')
  const [, startTransition] = useTransition()

  const persist = async (next: string[]) => {
    const result = await updateNuggetTags(token, nuggetId, next)
    if (!result.ok) {
      alert(`[FAIL] DB_WRITE_REJECTED: ${result.error}`)
      return false
    }
    startTransition(() => router.refresh())
    return true
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = draft.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '_')
    if (!t) return
    if (tags.some(existing => existing.toLowerCase() === t)) {
      setDraft('')
      return
    }
    const next = [...tags, t]
    const previous = tags
    setTags(next)
    setDraft('')
    const ok = await persist(next)
    if (!ok) setTags(previous)
  }

  const handleRemove = async (tag: string) => {
    const next = tags.filter(t => t !== tag)
    const previous = tags
    setTags(next)
    const ok = await persist(next)
    if (!ok) setTags(previous)
  }

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2 items-center">
      {tags.map(tag => (
        <span
          key={tag}
          className="font-mono text-xs uppercase tracking-wide text-muted-foreground inline-flex items-center group"
        >
          <Link
            href={`/u/${token}?q=${encodeURIComponent(tag)}`}
            className="hover:text-foreground"
          >
            #{tag}
          </Link>
          <button
            onClick={() => handleRemove(tag)}
            className="ml-1 opacity-40 hover:opacity-100 hover:text-destructive transition-opacity"
            aria-label={`remove ${tag}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <form onSubmit={handleAdd} className="inline-flex">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="+TAG"
          className="font-mono text-xs uppercase tracking-wide bg-transparent border-b border-dashed border-muted-foreground focus:border-foreground outline-none w-20 px-1 placeholder:text-muted-foreground/60"
        />
      </form>
    </div>
  )
}
