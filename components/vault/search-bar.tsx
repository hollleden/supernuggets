'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface SearchBarProps {
  /** Controlled mode: parent owns the value (e.g. home page live filtering). */
  value?: string
  onChange?: (v: string) => void
  /**
   * Standalone mode: omit value/onChange, the bar manages its own state and on
   * submit navigates to /?q=<value>. Useful from non-home pages.
   */
  navigateOnSubmit?: boolean
  placeholder?: string
  className?: string
}

export function SearchBar({
  value,
  onChange,
  navigateOnSubmit = false,
  placeholder = 'SEARCH NUGGETS, TAGS, FOLDERS...',
  className,
}: SearchBarProps) {
  const router = useRouter()
  const params = useParams<{ token?: string }>()
  const tokenPrefix = params?.token ? `/u/${params.token}` : ''
  const homeHref = tokenPrefix || '/'
  const [internal, setInternal] = useState('')
  const controlled = value !== undefined
  const current = controlled ? value! : internal

  const setCurrent = (v: string) => {
    if (controlled) onChange?.(v)
    else setInternal(v)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!navigateOnSubmit) return
    const q = current.trim()
    router.push(q ? `${homeHref}?q=${encodeURIComponent(q)}` : homeHref)
  }

  return (
    <form onSubmit={handleSubmit} className={className ?? 'flex-1 relative'}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
      <Input
        type="search"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder={placeholder}
        className="pl-10 h-10 bg-card border-foreground rounded-none font-mono text-xs uppercase tracking-wider placeholder:text-muted-foreground/60"
      />
    </form>
  )
}
