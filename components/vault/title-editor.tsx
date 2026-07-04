'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateNuggetTitle } from '@/app/actions/nuggets'
import { Check, X, Edit2 } from 'lucide-react'

interface TitleEditorProps {
  nuggetId: number
  initialTitle: string
  token: string
}

export function TitleEditor({ nuggetId, initialTitle, token }: TitleEditorProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [draft, setDraft] = useState(initialTitle)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      alert('Title cannot be empty')
      return
    }
    if (trimmed === title) {
      setIsEditing(false)
      return
    }
    const result = await updateNuggetTitle(token, nuggetId, trimmed)
    if (!result.ok) {
      alert(`save failed — ${result.error}`)
      setDraft(title)
      return
    }
    setTitle(trimmed)
    setIsEditing(false)
    startTransition(() => router.refresh())
  }

  const handleCancel = () => {
    setDraft(title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-2xl md:text-3xl font-black tracking-tight leading-[1.15] text-black dark:text-white uppercase bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-600 rounded px-3 py-2 outline-none resize-none"
          rows={3}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="w-11 h-11 flex items-center justify-center rounded-[4px] border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
            aria-label="save"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            className="w-11 h-11 flex items-center justify-center rounded-[4px] border border-gray-300 dark:border-neutral-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            aria-label="cancel"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 dark:text-neutral-500">
            Ctrl+Enter to save, Esc to cancel
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="group inline-block relative">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-black dark:text-white uppercase leading-[1.15] mb-4">
        {title}
      </h1>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-0 -right-11 w-11 h-11 flex items-center justify-center rounded-[4px] border border-gray-200 dark:border-neutral-700 text-gray-400 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-black dark:hover:text-white hover:border-gray-300 dark:hover:border-neutral-600"
        aria-label="edit title"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  )
}
