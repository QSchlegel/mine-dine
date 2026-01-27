// Dinner planning agent logic

import { generateJSON } from './openai'

export interface DinnerPlanningParams {
  cuisine?: string
  guestCount: number
  dietaryRestrictions?: string[]
  budgetRange?: { min: number; max: number }
  theme?: string
  occasion?: string
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  location?: string
}

export interface MenuItem {
  course: string // e.g., "Appetizer", "Main Course", "Dessert"
  name: string
  description: string
  dietaryInfo?: string[]
}

export interface Ingredient {
  name: string
  quantity: string
  unit?: string
  category?: string // e.g., "Produce", "Dairy", "Meat"
}

export interface PrepStep {
  time: string // e.g., "2 hours before"
  task: string
  duration?: string // e.g., "30 minutes"
}

export interface PricingBreakdown {
  ingredients: number
  labor?: number
  overhead?: number
  suggestedPricePerPerson: number
  totalCost: number
}

export interface DinnerPlan {
  menuItems: MenuItem[]
  ingredientList: Ingredient[]
  prepTimeline: PrepStep[]
  pricingBreakdown: PricingBreakdown
  description: string
  estimatedPrepTime: string
  estimatedCookingTime: string
  servingNotes?: string
}

const dinnerPlanSchema = {
  type: 'object',
  properties: {
    menuItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          course: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          dietaryInfo: { type: 'array', items: { type: 'string' } },
        },
        required: ['course', 'name', 'description'],
      },
    },
    ingredientList: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'string' },
          unit: { type: 'string' },
          category: { type: 'string' },
        },
        required: ['name', 'quantity'],
      },
    },
    prepTimeline: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          time: { type: 'string' },
          task: { type: 'string' },
          duration: { type: 'string' },
        },
        required: ['time', 'task'],
      },
    },
    pricingBreakdown: {
      type: 'object',
      properties: {
        ingredients: { type: 'number' },
        labor: { type: 'number' },
        overhead: { type: 'number' },
        suggestedPricePerPerson: { type: 'number' },
        totalCost: { type: 'number' },
      },
      required: ['ingredients', 'suggestedPricePerPerson', 'totalCost'],
    },
    description: { type: 'string' },
    estimatedPrepTime: { type: 'string' },
    estimatedCookingTime: { type: 'string' },
    servingNotes: { type: 'string' },
  },
  required: ['menuItems', 'ingredientList', 'prepTimeline', 'pricingBreakdown', 'description'],
}

export async function generateDinnerPlan(
  params: DinnerPlanningParams
): Promise<DinnerPlan> {
  const prompt = buildPlanningPrompt(params)

  try {
    const plan = await generateJSON<DinnerPlan>(prompt, dinnerPlanSchema, {
      temperature: 0.8,
    })

    // Validate and enhance the plan
    return validateAndEnhancePlan(plan, params)
  } catch (error) {
    console.error('Error generating dinner plan:', error)
    throw new Error('Failed to generate dinner plan. Please try again.')
  }
}

function buildPlanningPrompt(params: DinnerPlanningParams): string {
  const {
    cuisine,
    guestCount,
    dietaryRestrictions = [],
    budgetRange,
    theme,
    occasion,
    skillLevel,
    location,
  } = params

  let prompt = `You are an expert dinner party planner. Create a comprehensive dinner plan for a supper club event.

Requirements:
- Number of guests: ${guestCount}
${cuisine ? `- Cuisine type: ${cuisine}` : ''}
${dietaryRestrictions.length > 0 ? `- Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
${budgetRange ? `- Budget range: €${budgetRange.min}-€${budgetRange.max} per person` : ''}
${theme ? `- Theme: ${theme}` : ''}
${occasion ? `- Occasion: ${occasion}` : ''}
${skillLevel ? `- Host skill level: ${skillLevel}` : ''}
${location ? `- Location: ${location}` : ''}

Please create a complete dinner plan including:

1. Menu Items: A full menu with multiple courses (appetizer, main course, dessert, and optionally sides). Each item should include:
   - Course name (e.g., "Appetizer", "Main Course")
   - Dish name
   - Description
   - Dietary information (vegetarian, vegan, gluten-free, etc.)

2. Ingredient List: A comprehensive shopping list with:
   - Ingredient name
   - Quantity needed
   - Unit (if applicable)
   - Category (Produce, Dairy, Meat, Pantry, etc.)

3. Prep Timeline: A detailed timeline showing:
   - When to do each task (e.g., "2 days before", "Morning of", "2 hours before")
   - What task to do
   - Estimated duration

4. Pricing Breakdown: Calculate:
   - Total ingredient cost
   - Suggested price per person (should be reasonable and include a margin for the host)
   - Total cost for all ingredients

5. Description: A compelling description of the dinner experience

6. Time Estimates:
   - Estimated prep time
   - Estimated cooking time

7. Serving Notes: Any special notes about serving, presentation, or timing

Make sure the plan is:
- Realistic and achievable
- Appropriate for the skill level
- Respects dietary restrictions
- Fits within the budget if specified
- Creates a memorable dining experience

Return the response as JSON matching the provided schema.`

  return prompt
}

function validateAndEnhancePlan(plan: DinnerPlan, params: DinnerPlanningParams): DinnerPlan {
  // Ensure all required fields exist
  if (!plan.menuItems || plan.menuItems.length === 0) {
    throw new Error('Generated plan is missing menu items')
  }

  if (!plan.ingredientList || plan.ingredientList.length === 0) {
    throw new Error('Generated plan is missing ingredient list')
  }

  if (!plan.prepTimeline || plan.prepTimeline.length === 0) {
    throw new Error('Generated plan is missing prep timeline')
  }

  // Ensure pricing is reasonable
  if (plan.pricingBreakdown.suggestedPricePerPerson < 20) {
    plan.pricingBreakdown.suggestedPricePerPerson = 50 // Default minimum
  }

  if (plan.pricingBreakdown.suggestedPricePerPerson > 200) {
    plan.pricingBreakdown.suggestedPricePerPerson = 100 // Cap at reasonable maximum
  }

  return plan
}
