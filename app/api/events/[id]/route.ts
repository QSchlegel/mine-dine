import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { privateEventUpdateSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const privateEventSelect = {
  id: true,
  hostId: true,
  title: true,
  description: true,
  dateTime: true,
  location: true,
  maxGuests: true,
  basePricePerPerson: true,
  status: true,
  imageUrl: true,
  visibility: true,
} as const

/**
 * Get one private event for the current host.
 * GET /api/events/[id]
 */
export const GET = withAuth(async (
  _req: NextRequest,
  user,
  context?: { params?: Promise<{ [key: string]: string }> }
) => {
  try {
    const params = await context?.params
    const id = params?.id

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const event = await prisma.dinner.findFirst({
      where: {
        id,
        hostId: user.id,
        visibility: 'PRIVATE',
      },
      select: privateEventSelect,
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error fetching private event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
})

/**
 * Update one private event for the current host.
 * PATCH /api/events/[id]
 */
export const PATCH = withAuth(async (
  req: NextRequest,
  user,
  context?: { params?: Promise<{ [key: string]: string }> }
) => {
  try {
    const params = await context?.params
    const id = params?.id

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const existingEvent = await prisma.dinner.findFirst({
      where: {
        id,
        hostId: user.id,
        visibility: 'PRIVATE',
      },
      select: {
        id: true,
        basePricePerPerson: true,
      },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const body = await req.json()
    const { enableCostSplit, ...payload } = body ?? {}

    const validatedData = privateEventUpdateSchema.parse(payload)

    const event = await prisma.dinner.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        location: validatedData.location,
        dateTime: validatedData.dateTime ? new Date(validatedData.dateTime) : undefined,
        maxGuests: validatedData.maxGuests,
        imageUrl: validatedData.imageUrl === undefined ? undefined : validatedData.imageUrl,
        basePricePerPerson:
          typeof enableCostSplit === 'boolean'
            ? enableCostSplit
              ? (validatedData.basePricePerPerson ?? existingEvent.basePricePerPerson)
              : 0
            : validatedData.basePricePerPerson,
      },
      select: privateEventSelect,
    })

    return NextResponse.json({ event })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    console.error('Error updating private event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
})
