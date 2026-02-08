import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { privateEventCreateSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Get user's private events
 * GET /api/events
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') // optional filter
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      hostId: user.id,
      visibility: 'PRIVATE',
    }

    if (status) {
      where.status = status
    }

    const [events, total] = await Promise.all([
      prisma.dinner.findMany({
        where,
        include: {
          invitations: {
            select: {
              id: true,
              email: true,
              status: true,
            },
          },
          _count: {
            select: {
              invitations: true,
              bookings: true,
            },
          },
        },
        orderBy: {
          dateTime: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.dinner.count({ where }),
    ])

    // Calculate stats
    const upcoming = events.filter(
      (e) => new Date(e.dateTime) > new Date() && e.status === 'PUBLISHED'
    )
    const pendingRsvps = events.reduce(
      (acc, e) => acc + e.invitations.filter((i) => i.status === 'PENDING').length,
      0
    )

    return NextResponse.json({
      events,
      stats: {
        total,
        upcoming: upcoming.length,
        pendingRsvps,
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
})

/**
 * Create a new private event
 * POST /api/events
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const validatedData = privateEventCreateSchema.parse(body)

    // Create private event (auto-approved, no moderation needed)
    const event = await prisma.dinner.create({
      data: {
        hostId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        location: validatedData.location,
        dateTime: new Date(validatedData.dateTime),
        maxGuests: validatedData.maxGuests,
        imageUrl: validatedData.imageUrl || null,
        basePricePerPerson: validatedData.enableCostSplit ? (validatedData.basePricePerPerson || 0) : 0,
        visibility: 'PRIVATE',
        status: 'PUBLISHED', // Private events are immediately published
        moderationStatus: 'APPROVED', // Skip moderation for private events
        planningMode: 'MANUAL',
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
            invitations: true,
          },
        },
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
})
