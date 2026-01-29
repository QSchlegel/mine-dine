import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureModeratorReferralCode } from '@/lib/moderator'
import { z } from 'zod'

const reviewApplicationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
})

/**
 * Get a host application by ID (moderator only)
 * GET /api/hosts/applications/[id]
 */
export async function GET(
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

    const application = await prisma.hostApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            profileImageUrl: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        onboardedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ application })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Error fetching host application:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    )
  }
}

/**
 * Review a host application (admin or moderator only)
 * PATCH /api/hosts/applications/[id]
 */
export const dynamic = 'force-dynamic'

export async function PATCH(
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
    const validatedData = reviewApplicationSchema.parse(body)

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

    // Ensure moderator has referral code if they're a moderator
    if (user.role === 'MODERATOR') {
      await ensureModeratorReferralCode(user.id)
    }

    // Update application
    const updateData: any = {
      status: validatedData.status,
      rejectionReason: validatedData.rejectionReason,
      reviewedById: user.id,
      reviewedAt: new Date(),
    }

    // If approved by a moderator, track who onboarded the host
    if (validatedData.status === 'APPROVED' && user.role === 'MODERATOR') {
      updateData.onboardedById = user.id
    }

    const updatedApplication = await prisma.hostApplication.update({
      where: { id: applicationId },
      data: updateData,
    })

    // If approved, update user role to HOST
    if (validatedData.status === 'APPROVED') {
      await prisma.user.update({
        where: { id: application.userId },
        data: {
          role: 'HOST',
        },
      })
    }

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

    console.error('Error reviewing host application:', error)
    return NextResponse.json(
      { error: 'Failed to review application' },
      { status: 500 }
    )
  }
}
