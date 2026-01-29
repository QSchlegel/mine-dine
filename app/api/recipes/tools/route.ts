import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Tool finder for Dine Bot recipe workflows.
 * Searches public recipes for steps mentioning a tool keyword.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').trim()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const normalized = query.toLowerCase()

    const recipes = await prisma.recipe.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        steps: true,
        author: { select: { name: true } },
      },
    })

    const results: Array<{
      recipeId: string
      recipeTitle: string
      authorName: string | null
      matches: Array<{
        step: string
        index: number
      }>
    }> = []

    recipes.forEach((recipe) => {
      const steps = (recipe.steps as any[]) || []
      const matches = steps
        .map((item, index) => ({
          index,
          step: String(item?.step || item || ''),
        }))
        .filter((item) => item.step.toLowerCase().includes(normalized))

      if (matches.length > 0) {
        results.push({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          authorName: recipe.author?.name || null,
          matches,
        })
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Tool finder failed:', error)
    return NextResponse.json(
      { error: 'Failed to search tools' },
      { status: 500 }
    )
  }
}
