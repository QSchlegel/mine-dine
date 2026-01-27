import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Get moderator statistics
 * GET /api/moderators/stats
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

    // Get moderator's referral code
    const moderator = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCode: true },
    })

    // Count hosts onboarded
    const hostsOnboarded = await prisma.hostApplication.count({
      where: {
        onboardedById: user.id,
        status: 'APPROVED',
      },
    })

    // Count total bookings from onboarded hosts
    const onboardedHosts = await prisma.hostApplication.findMany({
      where: {
        onboardedById: user.id,
        status: 'APPROVED',
      },
      select: {
        userId: true,
      },
    })

    const onboardedHostIds = onboardedHosts.map((app) => app.userId)

    const totalOnboardingBookings = await prisma.booking.count({
      where: {
        dinner: {
          hostId: {
            in: onboardedHostIds,
          },
        },
        status: 'CONFIRMED',
      },
    })

    // Count total referral bookings
    const totalReferralBookings = moderator?.referralCode
      ? await prisma.booking.count({
          where: {
            referralCodeUsed: moderator.referralCode,
            status: 'CONFIRMED',
          },
        })
      : 0

    // Get revenue share totals
    const revenueShares = await prisma.revenueShare.findMany({
      where: {
        moderatorId: user.id,
      },
      select: {
        amount: true,
        status: true,
        shareType: true,
      },
    })

    const stats = {
      hostsOnboarded,
      totalOnboardingBookings,
      totalReferralBookings,
      referralCode: moderator?.referralCode || null,
      revenue: {
        totalPending: 0,
        totalPaid: 0,
        totalCancelled: 0,
        totalAmount: 0,
        onboardingTotal: 0,
        referralTotal: 0,
      },
    }

    revenueShares.forEach((share) => {
      stats.revenue.totalAmount += share.amount
      if (share.status === 'PENDING') stats.revenue.totalPending += share.amount
      if (share.status === 'PAID') stats.revenue.totalPaid += share.amount
      if (share.status === 'CANCELLED') stats.revenue.totalCancelled += share.amount
      if (share.shareType === 'ONBOARDING') stats.revenue.onboardingTotal += share.amount
      if (share.shareType === 'REFERRAL') stats.revenue.referralTotal += share.amount
    })

    return NextResponse.json({ stats })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Error fetching moderator stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
