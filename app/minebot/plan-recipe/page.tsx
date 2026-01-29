'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { MineBotPanel } from '@/components/assistant/MineBotPanel'
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
            Sign in to craft recipes with MineBot.
          </p>
          <Button href="/login" className="mt-6" size="lg">
            Sign in
          </Button>
        </div>
      </div>
    )
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
    } catch (err) {
      console.error('Failed to generate recipe plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate recipe plan')
    } finally {
      setIsGenerating(false)
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
        body: JSON.stringify(plan),
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
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Plan a Recipe</h1>
          <p className="text-[var(--foreground-secondary)] mt-2">
            Outline a recipe with MineBot and publish it to the community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recipe brief</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  label="What should MineBot cook?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A cozy vegetarian pasta for a dinner party with friends"
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
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  size="lg"
                >
                  {isGenerating ? 'Generating...' : 'Generate recipe plan'}
                </Button>
              </CardContent>
            </Card>

            {plan && (
              <Card>
                <CardHeader>
                  <CardTitle>{plan.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
            )}
          </div>

          <MineBotPanel
            mode="plan_recipe"
            title="MineBot Recipe Studio"
            subtitle="Refine flavors, steps, and plating"
            initialMessage="Tell me the ingredients or vibe you want, and I’ll craft a recipe plan."
          />
        </div>
      </div>
    </div>
  )
}
