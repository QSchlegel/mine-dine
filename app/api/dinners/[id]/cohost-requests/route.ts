import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { canAdminDinner, getDinnerAccess } from '@/lib/dinner-authz'

export const dynamic = 'force-dynamic'

/**
 * List co-host requests and approved co-hosts for a dinner.
 * GET /api/dinners/[id]/cohost-requests
 */
export const GET = withAuth(async (
  _req: NextRequest,
  user,
  context?: { params?: Promise<{ [key: string]: string }> }
) => {
  try {
    const params = await context?.params
    const dinnerId = params?.id

    if (!dinnerId) {
      return NextResponse.json({ error: 'Dinner ID is required' }, { status: 400 })
    }

    const access = await getDinnerAccess(user.id, dinnerId)
    if (!canAdminDinner(access)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [requests, cohosts] = await Promise.all([
      prisma.dinnerCohostRequest.findMany({
        where: { dinnerId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImageUrl: true,
            },
          },
        },
      }),
      prisma.dinnerCollaborator.findMany({
        where: {
          dinnerId,
          role: 'COHOST',
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImageUrl: true,
            },
          },
          createdAt: true,
        },
      }),
    ])

    return NextResponse.json({ requests, cohosts })
  } catch (error) {
    console.error('Error listing cohost requests:', error)
    return NextResponse.json(
      { error: 'Failed to load cohost requests' },
      { status: 500 }
    )
  }
})
