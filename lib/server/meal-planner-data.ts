import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export interface MealPlannerInitialData {
  isHost: boolean
  bookings: Array<{
    id: string
    status: string
    numberOfGuests: number
    dinner: {
      id: string
      title: string
      dateTime: string
      location: string
      host: {
        name: string | null
      }
    }
  }>
  hostDinners: Array<{
    id: string
    title: string
    dateTime: string
    status: string
    location: string
  }>
  recipes: Array<{
    id: string
    title: string
    prepTime?: string | null
    cookTime?: string | null
    servings?: number | null
  }>
}

export async function getMealPlannerInitialData(): Promise<MealPlannerInitialData | null> {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const isHost = user.role === 'HOST' || user.role === 'ADMIN'

  const [bookings, hostDinners, recipes] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: user.id,
        dinner: {
          dateTime: {
            gt: new Date(),
          },
        },
      },
      select: {
        id: true,
        status: true,
        numberOfGuests: true,
        dinner: {
          select: {
            id: true,
            title: true,
            dateTime: true,
            location: true,
            host: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        dinner: {
          dateTime: 'asc',
        },
      },
    }),
    isHost
      ? prisma.dinner.findMany({
          where: {
            hostId: user.id,
            dateTime: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
            title: true,
            dateTime: true,
            status: true,
            location: true,
          },
          orderBy: {
            dateTime: 'asc',
          },
        })
      : Promise.resolve([]),
    prisma.recipe.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        title: true,
        prepTime: true,
        cookTime: true,
        servings: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ])

  return {
    isHost,
    bookings: bookings.map((booking) => ({
      ...booking,
      dinner: {
        ...booking.dinner,
        dateTime: booking.dinner.dateTime.toISOString(),
      },
    })),
    hostDinners: hostDinners.map((dinner) => ({
      ...dinner,
      dateTime: dinner.dateTime.toISOString(),
    })),
    recipes,
  }
}
