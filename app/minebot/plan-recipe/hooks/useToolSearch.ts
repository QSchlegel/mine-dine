'use client'

import { useState, useCallback } from 'react'
import { searchTools as searchToolsApi } from '@/lib/api/recipes'
import type { ToolSearchResult } from '@/lib/api/recipes'

export function useToolSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ToolSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    try {
      const { results: data } = await searchToolsApi(q)
      setResults(data)
    } catch (err) {
      console.error('Tool finder failed:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  return { query, setQuery, results, loading, search }
}
