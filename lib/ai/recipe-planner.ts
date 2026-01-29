import { generateJSON } from './llm'

export interface RecipePlanningParams {
  prompt: string
  servings?: number
  dietaryRestrictions?: string[]
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  cuisine?: string
}

export interface RecipeIngredient {
  name: string
  quantity: string
  unit?: string
  notes?: string
}

export interface RecipeStep {
  step: string
  duration?: string
}

export interface RecipePlan {
  title: string
  description: string
  servings: number
  prepTime: string
  cookTime: string
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  tags?: string[]
}

const recipePlanSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    servings: { type: 'number' },
    prepTime: { type: 'string' },
    cookTime: { type: 'string' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'string' },
          unit: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['name', 'quantity'],
      },
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          step: { type: 'string' },
          duration: { type: 'string' },
        },
        required: ['step'],
      },
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['title', 'description', 'servings', 'prepTime', 'cookTime', 'ingredients', 'steps'],
}

export async function generateRecipePlan(
  params: RecipePlanningParams
): Promise<RecipePlan> {
  const prompt = buildRecipePrompt(params)

  const plan = await generateJSON<RecipePlan>(prompt, recipePlanSchema, {
    temperature: 0.8,
  })

  if (!plan.title || plan.ingredients.length === 0 || plan.steps.length === 0) {
    throw new Error('Generated recipe plan is incomplete')
  }

  return plan
}

function buildRecipePrompt(params: RecipePlanningParams): string {
  const {
    prompt,
    servings = 4,
    dietaryRestrictions = [],
    skillLevel = 'intermediate',
    cuisine,
  } = params

  return `You are an expert recipe developer. Create a detailed recipe plan based on the user's request.

User request: ${prompt}

Requirements:
- Servings: ${servings}
${cuisine ? `- Cuisine style: ${cuisine}` : ''}
${dietaryRestrictions.length > 0 ? `- Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
- Skill level: ${skillLevel}

Return:
1) Title
2) Short description
3) Prep time
4) Cook time
5) Ingredients with quantities and optional units/notes
6) Step-by-step instructions with optional time per step
7) Tags (e.g., vegetarian, quick, gluten-free) if helpful

Return JSON that matches the provided schema exactly.`
}
