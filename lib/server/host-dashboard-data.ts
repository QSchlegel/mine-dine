import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export interface HostDashboardInitialData {
  application: {
    id: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    applicationText: string
    rejectionReason?: string | null
    reviewedAt?: string | null
  } | null
  dinnerCount: number
  hasCompletedHostTour: boolean
}

export async function getHostDashboardInitialData(): Promise<HostDashboardInitialData | null> {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const [application, dinnerCount] = await Promise.all([
    prisma.hostApplication.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
        applicationText: true,
        rejectionReason: true,
        reviewedAt: true,
      },
    }),
    prisma.dinner.count({
      where: { hostId: user.id },
    }),
  ])

  return {
    application: application
      ? {
          ...application,
          reviewedAt: application.reviewedAt ? application.reviewedAt.toISOString() : null,
        }
      : null,
    dinnerCount,
    hasCompletedHostTour: user.hasCompletedHostTour,
  }
}
