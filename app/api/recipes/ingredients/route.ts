import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Lightweight ingredient finder for Dine Bot recipe workflows.
 * Searches public recipes for ingredient matches by substring (case-insensitive).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').trim()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Pull a recent slice of recipes to keep latency low
    const recipes = await prisma.recipe.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        ingredients: true,
        author: { select: { name: true } },
      },
    })

    const normalized = query.toLowerCase()
    const results: Array<{
      recipeId: string
      recipeTitle: string
      authorName: string | null
      matches: Array<{
        name: string
        quantity?: string
        unit?: string
        notes?: string
      }>
    }> = []

    recipes.forEach((recipe) => {
      const ingredients = (recipe.ingredients as any[]) || []
      const matches = ingredients.filter((ingredient) => {
        const name = String(ingredient?.name || '').toLowerCase()
        const notes = String(ingredient?.notes || '').toLowerCase()
        const unit = String(ingredient?.unit || '').toLowerCase()
        return (
          name.includes(normalized) ||
          notes.includes(normalized) ||
          unit.includes(normalized)
        )
      })

      if (matches.length > 0) {
        results.push({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          authorName: recipe.author?.name || null,
          matches: matches.map((item) => ({
            name: String(item?.name || ''),
            quantity: item?.quantity ? String(item.quantity) : undefined,
            unit: item?.unit ? String(item.unit) : undefined,
            notes: item?.notes ? String(item.notes) : undefined,
          })),
        })
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Ingredient finder failed:', error)
    return NextResponse.json(
      { error: 'Failed to search ingredients' },
      { status: 500 }
    )
  }
}
