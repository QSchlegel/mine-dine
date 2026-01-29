import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const existing = await prisma.recipeLike.findUnique({
      where: {
        recipeId_userId: {
          recipeId: id,
          userId: user.id,
        },
      },
    })

    if (existing) {
      await prisma.recipeLike.delete({
        where: { id: existing.id },
      })
      return NextResponse.json({ liked: false }, { status: 200 })
    }

    await prisma.recipeLike.create({
      data: {
        recipeId: id,
        userId: user.id,
      },
    })

    return NextResponse.json({ liked: true }, { status: 200 })
  } catch (error) {
    console.error('Error toggling recipe like:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to like recipe' }, { status: 500 })
  }
}
