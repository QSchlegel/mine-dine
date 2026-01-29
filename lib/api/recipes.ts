import type { RecipePlan } from '@/lib/ai/recipe-planner'

// Search result types (used by ingredient/tool finder)
export interface IngredientMatch {
  name: string
  quantity?: string
  unit?: string
  notes?: string
}

export interface IngredientSearchResult {
  recipeId: string
  recipeTitle: string
  authorName: string | null
  matches: IngredientMatch[]
}

export interface ToolMatch {
  step: string
  index: number
}

export interface ToolSearchResult {
  recipeId: string
  recipeTitle: string
  authorName: string | null
  matches: ToolMatch[]
}

export interface GeneratePlanBody {
  prompt: string
  cuisine?: string
  servings?: number
  dietaryRestrictions?: string[]
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
}

export interface GenerateDishImageBody {
  title: string
  description?: string
  context?: string
}

export interface SaveRecipeResponse {
  recipe: { id: string }
}

async function getJson<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error || `Request failed with ${res.status}`)
  }
  return data as T
}

export async function generatePlan(body: GeneratePlanBody): Promise<{ plan: RecipePlan }> {
  const res = await fetch('/api/recipes/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return getJson(res)
}

export async function searchIngredients(q: string): Promise<{ results: IngredientSearchResult[] }> {
  const res = await fetch(`/api/recipes/ingredients?q=${encodeURIComponent(q)}`)
  const data = await getJson<{ results?: IngredientSearchResult[] }>(res)
  return { results: data.results ?? [] }
}

export async function searchTools(q: string): Promise<{ results: ToolSearchResult[] }> {
  const res = await fetch(`/api/recipes/tools?q=${encodeURIComponent(q)}`)
  const data = await getJson<{ results?: ToolSearchResult[] }>(res)
  return { results: data.results ?? [] }
}

export async function generateDishImage(
  body: GenerateDishImageBody
): Promise<{ imageUrl?: string }> {
  const res = await fetch('/api/recipes/generate-dish-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return getJson(res)
}

export async function saveRecipe(
  plan: RecipePlan,
  imageUrl?: string | null
): Promise<SaveRecipeResponse> {
  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...plan,
      ...(imageUrl && { imageUrl }),
    }),
  })
  return getJson(res)
}
