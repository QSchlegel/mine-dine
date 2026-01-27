import { prisma } from './prisma'
import { RevenueShareType } from '@prisma/client'

/**
 * Calculate onboarding revenue share percentage
 * Starts at 5% and decreases by 0.1% for each booking
 * @param bookingNumber - The booking number (1st, 2nd, 3rd, etc.)
 * @returns The percentage (0-5.0)
 */
export function calculateOnboardingShare(bookingNumber: number): number {
  const percentage = 5.0 - (bookingNumber - 1) * 0.1
  return Math.max(0, percentage)
}

/**
 * Calculate referral revenue share percentage
 * Starts at 5% and decreases by 0.1% for each booking
 * @param bookingNumber - The booking number (1st, 2nd, 3rd, etc.)
 * @returns The percentage (0-5.0)
 */
export function calculateReferralShare(bookingNumber: number): number {
  const percentage = 5.0 - (bookingNumber - 1) * 0.1
  return Math.max(0, percentage)
}

/**
 * Count previous confirmed bookings for a host
 * Used to determine booking number for onboarding share calculation
 * @param hostId - The host's user ID
 * @returns The count of previous confirmed bookings
 */
export async function countHostBookings(hostId: string): Promise<number> {
  const count = await prisma.booking.count({
    where: {
      dinner: {
        hostId,
      },
      status: 'CONFIRMED',
    },
  })

  return count
}

/**
 * Count previous referral bookings for a moderator
 * Used to determine booking number for referral share calculation
 * @param moderatorId - The moderator's user ID
 * @returns The count of previous confirmed bookings with this moderator's referral code
 */
export async function countModeratorReferralBookings(moderatorId: string): Promise<number> {
  const moderator = await prisma.user.findUnique({
    where: { id: moderatorId },
    select: { referralCode: true },
  })

  if (!moderator?.referralCode) {
    return 0
  }

  const count = await prisma.booking.count({
    where: {
      referralCodeUsed: moderator.referralCode,
      status: 'CONFIRMED',
    },
  })

  return count
}

/**
 * Create a revenue share record
 * @param moderatorId - The moderator's user ID
 * @param bookingId - The booking ID
 * @param shareType - Type of share (ONBOARDING or REFERRAL)
 * @param bookingNumber - The booking number for calculation
 * @param totalPrice - The total booking price
 * @returns The created RevenueShare record
 */
export async function createRevenueShare(
  moderatorId: string,
  bookingId: string,
  shareType: RevenueShareType,
  bookingNumber: number,
  totalPrice: number
) {
  const calculateShare = shareType === 'ONBOARDING' 
    ? calculateOnboardingShare 
    : calculateReferralShare

  const actualPercentage = calculateShare(bookingNumber)
  const amount = (totalPrice * actualPercentage) / 100

  // Only create revenue share if amount is greater than 0
  if (amount <= 0) {
    return null
  }

  const revenueShare = await prisma.revenueShare.create({
    data: {
      moderatorId,
      bookingId,
      shareType,
      basePercentage: 5.0,
      bookingNumber,
      actualPercentage,
      amount,
      status: 'PENDING',
    },
  })

  return revenueShare
}

/**
 * Process revenue shares for a confirmed booking
 * Creates onboarding share (if moderator onboarded the host) and referral share (if referral code was used)
 * @param bookingId - The booking ID
 */
export async function processRevenueSharesForBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      dinner: {
        include: {
          host: {
            include: {
              hostApplication: {
                include: {
                  onboardedBy: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!booking || booking.status !== 'CONFIRMED') {
    return
  }

  const host = booking.dinner.host
  const hostApplication = host.hostApplication

  // Process onboarding share if moderator onboarded this host
  if (hostApplication?.onboardedById && hostApplication.status === 'APPROVED') {
    // Count previous confirmed bookings (excluding this one)
    const previousCount = await prisma.booking.count({
      where: {
        dinner: {
          hostId: host.id,
        },
        status: 'CONFIRMED',
        id: {
          not: bookingId,
        },
      },
    })
    // This booking is the (previousCount + 1)th booking
    const onboardingBookingNumber = previousCount + 1

    await createRevenueShare(
      hostApplication.onboardedById,
      bookingId,
      'ONBOARDING',
      onboardingBookingNumber,
      booking.totalPrice
    )
  }

  // Process referral share if referral code was used
  if (booking.referralCodeUsed) {
    const moderator = await prisma.user.findUnique({
      where: {
        referralCode: booking.referralCodeUsed,
        role: 'MODERATOR',
      },
    })

    if (moderator) {
      // Count previous confirmed bookings with this referral code (excluding this one)
      const previousCount = await prisma.booking.count({
        where: {
          referralCodeUsed: booking.referralCodeUsed,
          status: 'CONFIRMED',
          id: {
            not: bookingId,
          },
        },
      })
      // This booking is the (previousCount + 1)th referral booking
      const referralBookingNumber = previousCount + 1

      await createRevenueShare(
        moderator.id,
        bookingId,
        'REFERRAL',
        referralBookingNumber,
        booking.totalPrice
      )
    }
  }
}
