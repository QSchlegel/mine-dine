import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Get pending items for moderation
 * GET /api/moderators/pending
 */
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()

    if (!hasRole(user, 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get pending host applications
    const pendingApplications = await prisma.hostApplication.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            profileImageUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Get pending dinners (dinners that need moderation)
    const pendingDinners = await prisma.dinner.findMany({
      where: {
        moderationStatus: 'PENDING',
        status: {
          in: ['DRAFT', 'PUBLISHED'],
        },
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({
      applications: pendingApplications,
      dinners: pendingDinners,
      counts: {
        applications: pendingApplications.length,
        dinners: pendingDinners.length,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Error fetching pending items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending items' },
      { status: 500 }
    )
  }
}
