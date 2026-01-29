import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })
    const userId = session?.user?.id

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImageUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: userId ? { where: { userId }, select: { id: true } } : undefined,
      },
    })

    if (!recipe || (!recipe.isPublic && recipe.authorId !== userId)) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    const { likes, ...rest } = recipe as any

    return NextResponse.json(
      {
        recipe: {
          ...rest,
          likedByCurrentUser: userId ? likes?.length > 0 : false,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 })
  }
}
