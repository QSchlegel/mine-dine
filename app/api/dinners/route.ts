import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { dinnerCreateSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

/**
 * Create a new dinner listing
 * POST /api/dinners
 */
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const validatedData = dinnerCreateSchema.parse(body)

    const isPrivateEvent = validatedData.visibility === 'PRIVATE'

    // Check if user is a host (only required for public dinners)
    // Any user can create private events
    if (!isPrivateEvent && user.role !== 'HOST' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only hosts can create public dinner listings' },
        { status: 403 }
      )
    }

    // Create dinner
    const dinner = await prisma.dinner.create({
      data: {
        hostId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        cuisine: validatedData.cuisine,
        maxGuests: validatedData.maxGuests,
        basePricePerPerson: validatedData.basePricePerPerson,
        location: validatedData.location,
        dateTime: new Date(validatedData.dateTime),
        imageUrl: validatedData.imageUrl,
        visibility: validatedData.visibility || 'PUBLIC',
        // Private events are auto-approved and published
        status: isPrivateEvent ? 'PUBLISHED' : 'DRAFT',
        moderationStatus: isPrivateEvent ? 'APPROVED' : 'PENDING',
        planningMode: validatedData.planningMode || 'MANUAL',
        aiPlanData: validatedData.aiPlanData || null,
        menuItems: validatedData.aiPlanData?.menuItems || null,
        prepTimeline: validatedData.aiPlanData?.prepTimeline || null,
        ingredientList: validatedData.aiPlanData?.ingredientList || null,
        tags: validatedData.tagIds ? {
          create: validatedData.tagIds.map((tagId) => ({
            tagId,
          })),
        } : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        host: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ dinner }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    console.error('Error creating dinner:', error)
    return NextResponse.json(
      { error: 'Failed to create dinner' },
      { status: 500 }
    )
  }
})

/**
 * Get all dinner listings (public only - private events are hidden from this endpoint)
 * GET /api/dinners
 */
export const GET = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') || 'PUBLISHED'
    const tagId = searchParams.get('tagId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      status: status as any,
      // Only show public dinners in the public listing
      visibility: 'PUBLIC',
    }

    if (tagId) {
      where.tags = {
        some: {
          tagId,
        },
      }
    }

    const [dinners, total] = await Promise.all([
      prisma.dinner.findMany({
        where,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          addOns: true,
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: {
          dateTime: 'asc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.dinner.count({ where }),
    ])

    return NextResponse.json({
      dinners,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching dinners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dinners' },
      { status: 500 }
    )
  }
}
