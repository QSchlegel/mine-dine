'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  generatePlan as generatePlanApi,
  generateDishImage as generateDishImageApi,
  saveRecipe as saveRecipeApi,
} from '@/lib/api/recipes'
import type { RecipePlan } from '@/lib/ai/recipe-planner'
import type { RecipePlanFormState } from './useRecipePlanForm'

export function useRecipePlanGeneration(form: RecipePlanFormState) {
  const router = useRouter()
  const [plan, setPlan] = useState<RecipePlan | null>(null)
  const [dishImageUrl, setDishImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingDishImage, setIsGeneratingDishImage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!form.prompt.trim()) return
    setIsGenerating(true)
    setError(null)
    try {
      const dietaryRestrictions = form.dietaryRestrictions
        ? form.dietaryRestrictions
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : []
      const { plan: newPlan } = await generatePlanApi({
        prompt: form.prompt,
        cuisine: form.cuisine || undefined,
        servings: form.servings,
        dietaryRestrictions,
        skillLevel: form.skillLevel,
      })
      setPlan(newPlan)
      setDishImageUrl(null)

      setIsGeneratingDishImage(true)
      try {
        const imgRes = await generateDishImageApi({
          title: newPlan.title,
          description: newPlan.description || undefined,
          context: form.cuisine ? `${form.cuisine} cuisine` : undefined,
        })
        if (imgRes.imageUrl) {
          setDishImageUrl(imgRes.imageUrl)
        }
      } catch (imgErr) {
        console.error('Dish image generation failed:', imgErr)
      } finally {
        setIsGeneratingDishImage(false)
      }
    } catch (err) {
      console.error('Failed to generate recipe plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate recipe plan')
    } finally {
      setIsGenerating(false)
    }
  }, [form.prompt, form.cuisine, form.servings, form.dietaryRestrictions, form.skillLevel])

  const handleGenerateDishImage = useCallback(async () => {
    if (!plan) return
    setIsGeneratingDishImage(true)
    setError(null)
    try {
      const data = await generateDishImageApi({
        title: plan.title,
        description: plan.description || undefined,
        context: form.cuisine ? `${form.cuisine} cuisine` : undefined,
      })
      if (data.imageUrl) {
        setDishImageUrl(data.imageUrl)
      }
    } catch (err) {
      console.error('Failed to generate dish image:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate dish image')
    } finally {
      setIsGeneratingDishImage(false)
    }
  }, [plan, form.cuisine])

  const handleSave = useCallback(async () => {
    if (!plan) return
    setIsSaving(true)
    setError(null)
    try {
      const data = await saveRecipeApi(plan, dishImageUrl)
      router.push(`/recipes/${data.recipe.id}`)
    } catch (err) {
      console.error('Failed to save recipe:', err)
      setError(err instanceof Error ? err.message : 'Failed to save recipe')
    } finally {
      setIsSaving(false)
    }
  }, [plan, dishImageUrl, router])

  return {
    plan,
    setPlan,
    dishImageUrl,
    setDishImageUrl,
    isGenerating,
    isGeneratingDishImage,
    isSaving,
    error,
    setError,
    handleGenerate,
    handleGenerateDishImage,
    handleSave,
  }
}
