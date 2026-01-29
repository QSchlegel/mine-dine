import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'

type EventType = 'view' | 'use' | 'xp'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const event = (body?.event || '').toLowerCase() as EventType
    const dinnerId = typeof body?.dinnerId === 'string' ? body.dinnerId : undefined
    const xp = Number(body?.xp) || 0

    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })
    const userId = session?.user?.id

    // Public view increment requires no auth; other events require auth
    if (event !== 'view' && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    switch (event) {
      case 'view':
        await prisma.recipe.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        })
        break
      case 'use':
        await prisma.$transaction([
          prisma.recipe.update({
            where: { id },
            data: { useCount: { increment: 1 }, experience: { increment: 2 } },
          }),
          prisma.recipeUsage.create({
            data: {
              recipeId: id,
              dinnerId: dinnerId || null,
              count: 1,
              note: body?.note || null,
            },
          }),
        ])
        break
      case 'xp':
        if (xp > 0) {
          await prisma.recipe.update({
            where: { id },
            data: { experience: { increment: xp } },
          })
        }
        break
      default:
        return NextResponse.json({ error: 'Unsupported event' }, { status: 400 })
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      select: { viewCount: true, useCount: true, experience: true },
    })

    return NextResponse.json({ stats: recipe }, { status: 200 })
  } catch (error) {
    console.error('Failed to update recipe stats:', error)
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 })
  }
}
