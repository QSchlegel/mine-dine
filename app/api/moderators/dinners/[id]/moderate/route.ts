import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/admin-actions'
import { z } from 'zod'

const moderateSchema = z.object({
  moderationStatus: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().trim().optional(),
})

/**
 * Moderate a dinner (moderator or admin only)
 * POST /api/moderators/dinners/[id]/moderate
 */
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()

    if (!hasRole(user, 'MODERATOR')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: dinnerId } = await params
    const body = await req.json()
    const validated = moderateSchema.parse(body)

    const dinner = await prisma.dinner.findUnique({ where: { id: dinnerId } })
    if (!dinner) {
      return NextResponse.json({ error: 'Dinner not found' }, { status: 404 })
    }

    const nextStatus = validated.moderationStatus
    const nextDinnerStatus = nextStatus === 'REJECTED' ? 'CANCELLED' : undefined

    const updatedDinner = await prisma.dinner.update({
      where: { id: dinnerId },
      data: {
        moderationStatus: nextStatus,
        moderatedAt: new Date(),
        moderatedById: user.id,
        ...(nextDinnerStatus ? { status: nextDinnerStatus } : {}),
      },
      include: {
        host: { select: { id: true, name: true, email: true, profileImageUrl: true } },
        tags: { include: { tag: true } },
      },
    })

    await logAdminAction({
      actorId: user.id,
      action: 'DINNER_MODERATION',
      entityType: 'Dinner',
      entityId: dinnerId,
      decision: nextStatus,
      note: validated.note ?? null,
    })

    return NextResponse.json({ dinner: updatedDinner })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Error moderating dinner:', error)
    return NextResponse.json({ error: 'Failed to moderate dinner' }, { status: 500 })
  }
}
