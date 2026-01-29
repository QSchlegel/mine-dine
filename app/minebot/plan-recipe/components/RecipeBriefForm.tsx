'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ProgressBar } from '@/components/ui/ProgressRing'
import type { RecipePlanFormState, SkillLevel } from '../hooks/useRecipePlanForm'

interface RecipeBriefFormProps {
  form: RecipePlanFormState
  setPrompt: (value: string) => void
  setCuisine: (value: string) => void
  setServings: (value: number) => void
  setDietaryRestrictions: (value: string) => void
  setSkillLevel: (value: SkillLevel) => void
  onGenerate: () => void
  isGenerating: boolean
  error: string | null
}

export function RecipeBriefForm({
  form,
  setPrompt,
  setCuisine,
  setServings,
  setDietaryRestrictions,
  setSkillLevel,
  onGenerate,
  isGenerating,
  error,
}: RecipeBriefFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recipe brief</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          label="What should MineBot cook?"
          value={form.prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., pasta vongole, chocolate cake"
          rows={4}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Cuisine (optional)"
            value={form.cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="Italian, Thai, Mediterranean"
          />
          <Input
            label="Servings"
            type="number"
            min={1}
            value={form.servings}
            onChange={(e) => setServings(Number(e.target.value))}
          />
        </div>
        <Input
          label="Dietary restrictions (comma separated)"
          value={form.dietaryRestrictions}
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
                variant={form.skillLevel === level ? 'primary' : 'outline'}
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
            MineBot will suggest ingredients and steps; you can refine them in the panel on the
            right.
          </p>
          {isGenerating && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">
                Generating recipe plan…
              </p>
              <ProgressBar indeterminate variant="primary" size="lg" className="max-w-full" />
            </div>
          )}
          <Button
            onClick={onGenerate}
            disabled={!form.prompt.trim() || isGenerating}
            size="lg"
          >
            {isGenerating ? 'Generating...' : 'Generate recipe plan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
