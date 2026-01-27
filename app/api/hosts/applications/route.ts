import { NextRequest, NextResponse } from 'next/server'
import { withRole } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

/**
 * Get all host applications (admin or moderator only)
 * GET /api/hosts/applications
 */
export const dynamic = 'force-dynamic'

export const GET = withRole('MODERATOR', async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status')

    const where = status ? { status: status as any } : {}

    const applications = await prisma.hostApplication.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching host applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
})
