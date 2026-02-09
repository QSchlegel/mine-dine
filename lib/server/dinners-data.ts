import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export interface DinnersInitialData {
  dinners: Array<{
    id: string
    title: string
    description: string
    dateTime: string
    location: string
    basePricePerPerson: number
    maxGuests: number
    imageUrl?: string | null
    host: {
      id: string
      name: string | null
      profileImageUrl: string | null
    }
    _count: {
      bookings: number
    }
  }>
  userRole: 'USER' | 'HOST' | 'MODERATOR' | 'ADMIN' | null
}

export async function getDinnersInitialData(): Promise<DinnersInitialData> {
  const user = await getCurrentUser()

  const dinners = await prisma.dinner.findMany({
    where: {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          profileImageUrl: true,
        },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
    orderBy: {
      dateTime: 'asc',
    },
    take: 20,
  })

  return {
    dinners: dinners.map((dinner) => ({
      ...dinner,
      dateTime: dinner.dateTime.toISOString(),
    })),
    userRole: user?.role ?? null,
  }
}
