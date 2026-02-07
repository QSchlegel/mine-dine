import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/admin-actions'
import { z } from 'zod'

const decideSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().trim().optional(),
})

/**
 * Decide a host application (moderator or admin only)
 * POST /api/moderators/host-applications/[id]/decide
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

    const { id: applicationId } = await params
    const body = await req.json()
    const validatedData = decideSchema.parse(body)

    const application = await prisma.hostApplication.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Application has already been reviewed' },
        { status: 400 }
      )
    }

    const nextStatus = validatedData.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'

    const updatedApplication = await prisma.hostApplication.update({
      where: { id: applicationId },
      data: {
        status: nextStatus,
        rejectionReason: nextStatus === 'REJECTED' ? validatedData.note ?? null : null,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    })

    if (nextStatus === 'APPROVED') {
      await prisma.user.update({
        where: { id: application.userId },
        data: { role: 'HOST' },
      })
    }

    await logAdminAction({
      actorId: user.id,
      action: 'HOST_APPLICATION_DECISION',
      entityType: 'HostApplication',
      entityId: applicationId,
      decision: nextStatus,
      note: validatedData.note ?? null,
    })

    return NextResponse.json({ application: updatedApplication })
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

    console.error('Error deciding host application:', error)
    return NextResponse.json(
      { error: 'Failed to decide host application' },
      { status: 500 }
    )
  }
}
