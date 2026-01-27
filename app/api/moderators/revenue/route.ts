import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Get moderator revenue shares
 * GET /api/moderators/revenue
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

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') as 'PENDING' | 'PAID' | 'CANCELLED' | null
    const shareType = searchParams.get('shareType') as 'ONBOARDING' | 'REFERRAL' | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      moderatorId: user.id,
    }

    if (status) {
      where.status = status
    }

    if (shareType) {
      where.shareType = shareType
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const revenueShares = await prisma.revenueShare.findMany({
      where,
      include: {
        booking: {
          include: {
            dinner: {
              select: {
                id: true,
                title: true,
                host: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate totals
    const totals = {
      totalPending: 0,
      totalPaid: 0,
      totalCancelled: 0,
      totalAmount: 0,
      onboardingTotal: 0,
      referralTotal: 0,
    }

    revenueShares.forEach((share) => {
      totals.totalAmount += share.amount
      if (share.status === 'PENDING') totals.totalPending += share.amount
      if (share.status === 'PAID') totals.totalPaid += share.amount
      if (share.status === 'CANCELLED') totals.totalCancelled += share.amount
      if (share.shareType === 'ONBOARDING') totals.onboardingTotal += share.amount
      if (share.shareType === 'REFERRAL') totals.referralTotal += share.amount
    })

    return NextResponse.json({
      revenueShares,
      totals,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Error fetching moderator revenue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue shares' },
      { status: 500 }
    )
  }
}
