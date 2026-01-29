import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/better-auth'
import { generateDishImage } from '@/lib/ai/dish-image'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Dish image generation is not configured (OPENAI_API_KEY missing).' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const title = String(body?.title || '').trim()
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const imageUrl = await generateDishImage({
      title,
      description: body?.description ? String(body.description).trim() : undefined,
      context: body?.context ? String(body.context).trim() : undefined,
    })

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image generation did not return a URL.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ imageUrl }, { status: 200 })
  } catch (error) {
    console.error('Error generating dish image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate dish image' },
      { status: 500 }
    )
  }
}
