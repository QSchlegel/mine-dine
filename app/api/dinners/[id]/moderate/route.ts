import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const moderateDinnerSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
})

/**
 * Moderate a dinner (moderator or admin only)
 * POST /api/dinners/[id]/moderate
 */
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()

    if (!hasRole(user, 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id: dinnerId } = await params
    const body = await req.json()
    const validatedData = moderateDinnerSchema.parse(body)

    const dinner = await prisma.dinner.findUnique({
      where: { id: dinnerId },
    })

    if (!dinner) {
      return NextResponse.json(
        { error: 'Dinner not found' },
        { status: 404 }
      )
    }

    const moderationStatus = validatedData.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    const updateData: any = {
      moderationStatus,
      moderatedById: user.id,
      moderatedAt: new Date(),
    }

    // If approved, also publish the dinner if it's in DRAFT status
    if (validatedData.action === 'APPROVE' && dinner.status === 'DRAFT') {
      updateData.status = 'PUBLISHED'
    }

    const updatedDinner = await prisma.dinner.update({
      where: { id: dinnerId },
      data: updateData,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
        moderatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Error moderating dinner:', error)
    return NextResponse.json(
      { error: 'Failed to moderate dinner' },
      { status: 500 }
    )
  }
}
