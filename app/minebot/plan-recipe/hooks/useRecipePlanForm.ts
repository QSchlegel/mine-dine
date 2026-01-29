'use client'

import { useState, useCallback } from 'react'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

export interface RecipePlanFormState {
  prompt: string
  cuisine: string
  servings: number
  dietaryRestrictions: string
  skillLevel: SkillLevel
}

const defaultForm: RecipePlanFormState = {
  prompt: '',
  cuisine: '',
  servings: 4,
  dietaryRestrictions: '',
  skillLevel: 'intermediate',
}

export function useRecipePlanForm(initial?: Partial<RecipePlanFormState>) {
  const [form, setForm] = useState<RecipePlanFormState>(() => ({
    ...defaultForm,
    ...initial,
  }))

  const setPrompt = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, prompt: value }))
  }, [])
  const setCuisine = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, cuisine: value }))
  }, [])
  const setServings = useCallback((value: number) => {
    setForm((prev) => ({ ...prev, servings: value }))
  }, [])
  const setDietaryRestrictions = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, dietaryRestrictions: value }))
  }, [])
  const setSkillLevel = useCallback((value: SkillLevel) => {
    setForm((prev) => ({ ...prev, skillLevel: value }))
  }, [])

  return {
    form,
    setForm,
    setPrompt,
    setCuisine,
    setServings,
    setDietaryRestrictions,
    setSkillLevel,
  }
}
