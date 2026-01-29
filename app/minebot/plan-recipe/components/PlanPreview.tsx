'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { RecipePlan } from '@/lib/ai/recipe-planner'

interface PlanPreviewProps {
  plan: RecipePlan
  dishImageUrl: string | null
  isGeneratingDishImage: boolean
  onGenerateDishImage: () => void
  onClearImage: () => void
  onSave: () => void
  isSaving: boolean
}

export function PlanPreview({
  plan,
  dishImageUrl,
  isGeneratingDishImage,
  onGenerateDishImage,
  onClearImage,
  onSave,
  isSaving,
}: PlanPreviewProps) {
  return (
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
            onClick={onGenerateDishImage}
            disabled={isGeneratingDishImage}
          >
            {isGeneratingDishImage ? 'Generating…' : 'Generate dish image'}
          </Button>
          <span className="text-xs text-[var(--foreground-muted)]">
            AI image of the final dish, plated
          </span>
          {dishImageUrl && (
            <Button type="button" variant="outline" size="sm" onClick={onClearImage}>
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
        <Button onClick={onSave} disabled={isSaving} size="lg">
          {isSaving ? 'Saving...' : 'Publish recipe'}
        </Button>
      </CardContent>
    </Card>
  )
}
