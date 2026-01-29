import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/better-auth'
import { generateRecipePlan } from '@/lib/ai/recipe-planner'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const prompt = String(body?.prompt || '').trim()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const plan = await generateRecipePlan({
      prompt,
      servings: body?.servings ? Number(body.servings) : undefined,
      dietaryRestrictions: body?.dietaryRestrictions || [],
      skillLevel: body?.skillLevel,
      cuisine: body?.cuisine,
    })

    return NextResponse.json({ plan }, { status: 200 })
  } catch (error) {
    console.error('Error generating recipe plan:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recipe plan' },
      { status: 500 }
    )
  }
}
