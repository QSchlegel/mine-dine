'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Tabs, TabList, TabTrigger, TabPanel, useTabs } from '@/components/ui/Tabs'
import type { IngredientSearchResult, ToolSearchResult } from '@/lib/api/recipes'

interface SearchRecipesCardProps {
  ingredientSearch: {
    query: string
    results: IngredientSearchResult[]
    loading: boolean
    onQueryChange: (value: string) => void
    onSearch: () => void
  }
  toolSearch: {
    query: string
    results: ToolSearchResult[]
    loading: boolean
    onQueryChange: (value: string) => void
    onSearch: () => void
  }
}

export function SearchRecipesCard({
  ingredientSearch,
  toolSearch,
}: SearchRecipesCardProps) {
  const finderTabs = useTabs('ingredients')

  return (
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
                  value={ingredientSearch.query}
                  onChange={(e) => ingredientSearch.onQueryChange(e.target.value)}
                  placeholder="e.g., oyster mushrooms"
                />
                <Button
                  variant="secondary"
                  onClick={ingredientSearch.onSearch}
                  disabled={
                    !ingredientSearch.query.trim() || ingredientSearch.loading
                  }
                >
                  {ingredientSearch.loading ? 'Searching…' : 'Find'}
                </Button>
              </div>
              {ingredientSearch.results.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)]">
                  Search community recipes to borrow ingredient ideas.
                </p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {ingredientSearch.results.map((result) => (
                    <div
                      key={result.recipeId}
                      className="rounded-lg border border-[var(--border)] p-3"
                    >
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {result.recipeTitle}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {result.authorName
                          ? `by ${result.authorName}`
                          : 'Community recipe'}
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-[var(--foreground-secondary)]">
                        {result.matches.map((match, idx) => (
                          <li key={idx}>
                            {match.quantity && <span>{match.quantity} </span>}
                            {match.unit && <span>{match.unit} </span>}
                            <span className="font-medium">{match.name}</span>
                            {match.notes && (
                              <span className="text-[var(--foreground-muted)]">
                                {' '}
                                — {match.notes}
                              </span>
                            )}
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
                  value={toolSearch.query}
                  onChange={(e) => toolSearch.onQueryChange(e.target.value)}
                  placeholder="e.g., dutch oven, immersion blender"
                />
                <Button
                  variant="secondary"
                  onClick={toolSearch.onSearch}
                  disabled={!toolSearch.query.trim() || toolSearch.loading}
                >
                  {toolSearch.loading ? 'Searching…' : 'Find'}
                </Button>
              </div>
              {toolSearch.results.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)]">
                  Search recipe steps to see how others use specific tools.
                </p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {toolSearch.results.map((result) => (
                    <div
                      key={result.recipeId}
                      className="rounded-lg border border-[var(--border)] p-3"
                    >
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {result.recipeTitle}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {result.authorName
                          ? `by ${result.authorName}`
                          : 'Community recipe'}
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
  )
}
