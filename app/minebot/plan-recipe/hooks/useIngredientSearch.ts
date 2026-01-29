'use client'

import { useState, useCallback } from 'react'
import { searchIngredients as searchIngredientsApi } from '@/lib/api/recipes'
import type { IngredientSearchResult } from '@/lib/api/recipes'

export function useIngredientSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<IngredientSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    try {
      const { results: data } = await searchIngredientsApi(q)
      setResults(data)
    } catch (err) {
      console.error('Ingredient finder failed:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  return { query, setQuery, results, loading, search }
}
