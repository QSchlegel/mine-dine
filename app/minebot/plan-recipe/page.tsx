'use client'

import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { MineBotPanel } from '@/components/assistant/MineBotPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { useRecipePlanForm } from './hooks/useRecipePlanForm'
import { useRecipePlanGeneration } from './hooks/useRecipePlanGeneration'
import { useIngredientSearch } from './hooks/useIngredientSearch'
import { useToolSearch } from './hooks/useToolSearch'
import { RecipeBriefForm } from './components/RecipeBriefForm'
import { PlanPreview } from './components/PlanPreview'
import { SearchRecipesCard } from './components/SearchRecipesCard'

export default function MineBotPlanRecipePage() {
  const { data: session, isPending } = useSession()
  const form = useRecipePlanForm()
  const generation = useRecipePlanGeneration(form.form)
  const ingredientSearch = useIngredientSearch()
  const toolSearch = useToolSearch()

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

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          title="Plan a Recipe"
          subtitle="Describe your dish, generate a plan, then refine with MineBot or publish."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="space-y-6">
            <RecipeBriefForm
              form={form.form}
              setPrompt={form.setPrompt}
              setCuisine={form.setCuisine}
              setServings={form.setServings}
              setDietaryRestrictions={form.setDietaryRestrictions}
              setSkillLevel={form.setSkillLevel}
              onGenerate={generation.handleGenerate}
              isGenerating={generation.isGenerating}
              error={generation.error}
            />

            {generation.plan && (
              <>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Recipe plan ready. Refine with MineBot or publish.
                  </p>
                </div>
                <PlanPreview
                  plan={generation.plan}
                  dishImageUrl={generation.dishImageUrl}
                  isGeneratingDishImage={generation.isGeneratingDishImage}
                  onGenerateDishImage={generation.handleGenerateDishImage}
                  onClearImage={() => generation.setDishImageUrl(null)}
                  onSave={generation.handleSave}
                  isSaving={generation.isSaving}
                />
              </>
            )}
          </div>

          <div className="space-y-4">
            <MineBotPanel
              mode="plan_recipe"
              title="MineBot Recipe Studio"
              subtitle="Refine flavors, steps, and plating"
              initialMessage="Tell me the ingredients or vibe you want, and I'll craft a recipe plan."
              inputPlaceholder="Ask MineBot to refine, rename, or improve..."
            />

            <SearchRecipesCard
              ingredientSearch={{
                query: ingredientSearch.query,
                results: ingredientSearch.results,
                loading: ingredientSearch.loading,
                onQueryChange: ingredientSearch.setQuery,
                onSearch: ingredientSearch.search,
              }}
              toolSearch={{
                query: toolSearch.query,
                results: toolSearch.results,
                loading: toolSearch.loading,
                onQueryChange: toolSearch.setQuery,
                onSearch: toolSearch.search,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
