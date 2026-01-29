import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })
    const userId = session?.user?.id

    const include: any = {
      author: {
        select: {
          id: true,
          name: true,
          profileImageUrl: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    }

    if (userId) {
      include.likes = {
        where: { userId },
        select: { id: true },
      }
    }

    const recipes = await prisma.recipe.findMany({
      where: { isPublic: true },
      include,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const formatted = recipes.map((recipe: any) => {
      const { likes, ...rest } = recipe
      return {
        ...rest,
        likedByCurrentUser: userId ? likes?.length > 0 : false,
        stats: {
          views: recipe.viewCount,
          uses: recipe.useCount,
          experience: recipe.experience,
        },
      }
    })

    return NextResponse.json({ recipes: formatted }, { status: 200 })
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = String(body?.title || '').trim()
    const ingredients = body?.ingredients
    const steps = body?.steps

    if (!title || !Array.isArray(ingredients) || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'Title, ingredients, and steps are required' },
        { status: 400 }
      )
    }

    const imageUrl =
      typeof body?.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : null

    const recipe = await prisma.recipe.create({
      data: {
        authorId: session.user.id,
        title,
        description: body?.description?.trim() || null,
        imageUrl: imageUrl || undefined,
        servings: Number.isFinite(Number(body?.servings)) ? Number(body.servings) : null,
        prepTime: body?.prepTime || null,
        cookTime: body?.cookTime || null,
        ingredients,
        steps,
        tags: Array.isArray(body?.tags) ? body.tags : [],
        isPublic: body?.isPublic !== false,
        viewCount: 0,
        useCount: 0,
        experience: 0,
      },
    })

    return NextResponse.json({ recipe }, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
  }
}
