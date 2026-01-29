'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { MineBotPanel } from '@/components/assistant/MineBotPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs, TabList, TabTrigger, TabPanel, useTabs } from '@/components/ui/Tabs'
import { ProgressBar } from '@/components/ui/ProgressRing'
import type { RecipePlan } from '@/lib/ai/recipe-planner'

export default function MineBotPlanRecipePage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [prompt, setPrompt] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [servings, setServings] = useState(4)
  const [dietaryRestrictions, setDietaryRestrictions] = useState('')
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [isGenerating, setIsGenerating] = useState(false)
  const [plan, setPlan] = useState<RecipePlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [ingredientQuery, setIngredientQuery] = useState('')
  const [ingredientResults, setIngredientResults] = useState<
    Array<{
      recipeId: string
      recipeTitle: string
      authorName: string | null
      matches: Array<{ name: string; quantity?: string; unit?: string; notes?: string }>
    }>
  >([])
  const [toolQuery, setToolQuery] = useState('')
  const [toolResults, setToolResults] = useState<
    Array<{
      recipeId: string
      recipeTitle: string
      authorName: string | null
      matches: Array<{ step: string; index: number }>
    }>
  >([])
  const [isSearchingIngredients, setIsSearchingIngredients] = useState(false)
  const [isSearchingTools, setIsSearchingTools] = useState(false)
  const [dishImageUrl, setDishImageUrl] = useState<string | null>(null)
  const [isGeneratingDishImage, setIsGeneratingDishImage] = useState(false)
  const finderTabs = useTabs('ingredients')

  if (isPending) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Plan a Recipe</h1>
          <p className="text-[var(--foreground-muted)] mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Plan a Recipe</h1>
          <p className="text-[var(--foreground-muted)] mt-3">
            Sign in to craft recipes with Dine Bot.
          </p>
          <Button href="/login" className="mt-6" size="lg">
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  const searchIngredients = async () => {
    const q = ingredientQuery.trim()
    if (!q) return
    setIsSearchingIngredients(true)
    try {
      const res = await fetch(`/api/recipes/ingredients?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search ingredients')
      }
      setIngredientResults(data.results || [])
    } catch (err) {
      console.error('Ingredient finder failed:', err)
      setIngredientResults([])
    } finally {
      setIsSearchingIngredients(false)
    }
  }

  const searchTools = async () => {
    const q = toolQuery.trim()
    if (!q) return
    setIsSearchingTools(true)
    try {
      const res = await fetch(`/api/recipes/tools?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search tools')
      }
      setToolResults(data.results || [])
    } catch (err) {
      console.error('Tool finder failed:', err)
      setToolResults([])
    } finally {
      setIsSearchingTools(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/recipes/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          cuisine: cuisine || undefined,
          servings,
          dietaryRestrictions: dietaryRestrictions
            ? dietaryRestrictions.split(',').map((item) => item.trim()).filter(Boolean)
            : [],
          skillLevel,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recipe plan')
      }

      setPlan(data.plan)
      setDishImageUrl(null)

      // Automatically generate plated dish image
      setIsGeneratingDishImage(true)
      try {
        const imgRes = await fetch('/api/recipes/generate-dish-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.plan.title,
            description: data.plan.description || undefined,
            context: cuisine ? `${cuisine} cuisine` : undefined,
          }),
        })
        const imgData = await imgRes.json()
        if (imgRes.ok && imgData.imageUrl) {
          setDishImageUrl(imgData.imageUrl)
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
  }

  const handleGenerateDishImage = async () => {
    if (!plan) return
    setIsGeneratingDishImage(true)
    setError(null)
    try {
      const response = await fetch('/api/recipes/generate-dish-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: plan.title,
          description: plan.description || undefined,
          context: cuisine ? `${cuisine} cuisine` : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate dish image')
      }
      if (data.imageUrl) {
        setDishImageUrl(data.imageUrl)
      }
    } catch (err) {
      console.error('Failed to generate dish image:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate dish image')
    } finally {
      setIsGeneratingDishImage(false)
    }
  }

  const handleSave = async () => {
    if (!plan) return
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...plan,
          ...(dishImageUrl && { imageUrl: dishImageUrl }),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save recipe')
      }

      router.push(`/recipes/${data.recipe.id}`)
    } catch (err) {
      console.error('Failed to save recipe:', err)
      setError(err instanceof Error ? err.message : 'Failed to save recipe')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          title="Plan a Recipe"
          subtitle="Describe your dish, generate a plan, then refine with Dine Bot or publish."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recipe brief</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  label="What should Dine Bot cook?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., pasta vongole, chocolate cake"
                  rows={4}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Cuisine (optional)"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    placeholder="Italian, Thai, Mediterranean"
                  />
                  <Input
                    label="Servings"
                    type="number"
                    min={1}
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                  />
                </div>
                <Input
                  label="Dietary restrictions (comma separated)"
                  value={dietaryRestrictions}
                  onChange={(e) => setDietaryRestrictions(e.target.value)}
                  placeholder="Vegetarian, gluten-free"
                />
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Skill level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                      <Button
                        key={level}
                        type="button"
                        variant={skillLevel === level ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSkillLevel(level)}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
                {error && <p className="text-sm text-danger-500">{error}</p>}
                <div className="space-y-3">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Dine Bot will suggest ingredients and steps; you can refine them in the panel on the right.
                  </p>
                  {isGenerating && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[var(--foreground)]">Generating recipe plan…</p>
                      <ProgressBar indeterminate variant="primary" size="lg" className="max-w-full" />
                    </div>
                  )}
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    size="lg"
                  >
                    {isGenerating ? 'Generating...' : 'Generate recipe plan'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {plan && (
              <>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Recipe plan ready. Refine with Dine Bot or publish.
                  </p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>{plan.title}</CardTitle>
                  </CardHeader>
                <CardContent className="space-y-4">
                  {(dishImageUrl || isGeneratingDishImage) && (
                    <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--background-secondary)] aspect-video max-w-md">
                      {isGeneratingDishImage && !dishImageUrl ? (
                        <div className="flex items-center justify-center h-full text-sm text-[var(--foreground-muted)]">
                          Generating plated dish image…
                        </div>
                      ) : dishImageUrl ? (
                        <img
                          src={dishImageUrl}
                          alt={`${plan.title} plated`}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleGenerateDishImage}
                      disabled={isGeneratingDishImage}
                    >
                      {isGeneratingDishImage ? 'Generating…' : 'Generate dish image'}
                    </Button>
                    <span className="text-xs text-[var(--foreground-muted)]">
                      AI image of the final dish, plated
                    </span>
                    {dishImageUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDishImageUrl(null)}
                      >
                        Clear image
                      </Button>
                    )}
                  </div>
                  <p className="text-[var(--foreground-secondary)]">{plan.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--foreground-muted)]">
                    <div>Servings: {plan.servings}</div>
                    <div>Prep: {plan.prepTime}</div>
                    <div>Cook: {plan.cookTime}</div>
                    {plan.tags && plan.tags.length > 0 && (
                      <div>Tags: {plan.tags.join(', ')}</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-2">Ingredients</h3>
                    <ul className="space-y-2 text-sm text-[var(--foreground-secondary)]">
                      {plan.ingredients.map((ingredient, index) => (
                        <li key={index}>
                          {ingredient.quantity} {ingredient.unit ? ingredient.unit : ''} {ingredient.name}
                          {ingredient.notes ? ` (${ingredient.notes})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-2">Steps</h3>
                    <ol className="space-y-2 text-sm text-[var(--foreground-secondary)] list-decimal list-inside">
                      {plan.steps.map((step, index) => (
                        <li key={index}>
                          {step.step}
                          {step.duration ? ` (${step.duration})` : ''}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <Button onClick={handleSave} disabled={isSaving} size="lg">
                    {isSaving ? 'Saving...' : 'Publish recipe'}
                  </Button>
                </CardContent>
              </Card>
              </>
            )}
          </div>

          <div className="space-y-4">
            <MineBotPanel
              mode="plan_recipe"
              title="Dine Bot Recipe Studio"
              subtitle="Refine flavors, steps, and plating"
              initialMessage="Tell me the ingredients or vibe you want, and I’ll craft a recipe plan."
            />

            <Card className="border-[var(--border)]">
              <CardHeader>
                <CardTitle>Search recipes</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={finderTabs.value} onChange={finderTabs.onChange}>
                  <TabList>
                    <TabTrigger value="ingredients">Find ingredients</TabTrigger>
                    <TabTrigger value="tools">Find tools</TabTrigger>
                  </TabList>
                  <TabPanel value="ingredients">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={ingredientQuery}
                          onChange={(e) => setIngredientQuery(e.target.value)}
                          placeholder="e.g., oyster mushrooms"
                        />
                        <Button
                          variant="secondary"
                          onClick={searchIngredients}
                          disabled={!ingredientQuery.trim() || isSearchingIngredients}
                        >
                          {isSearchingIngredients ? 'Searching…' : 'Find'}
                        </Button>
                      </div>
                      {ingredientResults.length === 0 ? (
                        <p className="text-sm text-[var(--foreground-muted)]">
                          Search community recipes to borrow ingredient ideas.
                        </p>
                      ) : (
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                          {ingredientResults.map((result) => (
                            <div key={result.recipeId} className="rounded-lg border border-[var(--border)] p-3">
                              <p className="text-sm font-semibold text-[var(--foreground)]">
                                {result.recipeTitle}
                              </p>
                              <p className="text-xs text-[var(--foreground-muted)]">
                                {result.authorName ? `by ${result.authorName}` : 'Community recipe'}
                              </p>
                              <ul className="mt-2 space-y-1 text-sm text-[var(--foreground-secondary)]">
                                {result.matches.map((match, idx) => (
                                  <li key={idx}>
                                    {match.quantity && <span>{match.quantity} </span>}
                                    {match.unit && <span>{match.unit} </span>}
                                    <span className="font-medium">{match.name}</span>
                                    {match.notes && <span className="text-[var(--foreground-muted)]"> — {match.notes}</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabPanel>
                  <TabPanel value="tools">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={toolQuery}
                          onChange={(e) => setToolQuery(e.target.value)}
                          placeholder="e.g., dutch oven, immersion blender"
                        />
                        <Button
                          variant="secondary"
                          onClick={searchTools}
                          disabled={!toolQuery.trim() || isSearchingTools}
                        >
                          {isSearchingTools ? 'Searching…' : 'Find'}
                        </Button>
                      </div>
                      {toolResults.length === 0 ? (
                        <p className="text-sm text-[var(--foreground-muted)]">
                          Search recipe steps to see how others use specific tools.
                        </p>
                      ) : (
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                          {toolResults.map((result) => (
                            <div key={result.recipeId} className="rounded-lg border border-[var(--border)] p-3">
                              <p className="text-sm font-semibold text-[var(--foreground)]">
                                {result.recipeTitle}
                              </p>
                              <p className="text-xs text-[var(--foreground-muted)]">
                                {result.authorName ? `by ${result.authorName}` : 'Community recipe'}
                              </p>
                              <ul className="mt-2 space-y-1 text-sm text-[var(--foreground-secondary)]">
                                {result.matches.map((match, idx) => (
                                  <li key={idx}>
                                    Step {match.index + 1}: {match.step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabPanel>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
