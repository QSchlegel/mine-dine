import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getProfileCompletionProgress, type ProfileCompletionResult } from '@/lib/profile'

export interface DashboardInitialData {
  userName: string | null
  stats: {
    bookings: number
    upcomingBookings: number
  }
  profile: {
    id: string
    name: string | null
    bio: string | null
    hasCompletedGuestTour: boolean
    userTags: Array<{ tag: { id: string } }>
  } | null
  profileCompletion: ProfileCompletionResult | null
}

export async function getDashboardInitialData(): Promise<DashboardInitialData | null> {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const [bookings, profile] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: user.id },
      select: {
        status: true,
        dinner: {
          select: {
            dateTime: true,
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        bio: true,
        hasCompletedGuestTour: true,
        userTags: {
          include: {
            tag: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    }),
  ])

  if (!profile) {
    return null
  }

  const upcomingBookings = bookings.filter((booking) => {
    if (!booking.dinner?.dateTime) return false
    return booking.status === 'CONFIRMED' && new Date(booking.dinner.dateTime) > new Date()
  })

  return {
    userName: profile.name,
    stats: {
      bookings: bookings.length,
      upcomingBookings: upcomingBookings.length,
    },
    profile,
    profileCompletion: getProfileCompletionProgress(profile),
  }
}
