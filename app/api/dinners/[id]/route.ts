import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { hasRole } from '@/lib/auth'
import { dinnerUpdateSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

/**
 * Get a single dinner by ID
 * GET /api/dinners/[id]
 */
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const dinner = await prisma.dinner.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            bio: true,
            profileImageUrl: true,
            coverImageUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        addOns: true,
        groceryBills: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImageUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    })

    if (!dinner) {
      return NextResponse.json(
        { error: 'Dinner not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ dinner })
  } catch (error) {
    console.error('Error fetching dinner:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dinner' },
      { status: 500 }
    )
  }
}

/**
 * Update a dinner listing
 * PATCH /api/dinners/[id]
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
      return NextResponse.json(
        { error: 'Dinner ID is required' },
        { status: 400 }
      )
    }
    
    const dinner = await prisma.dinner.findUnique({
      where: { id },
    })

    if (!dinner) {
      return NextResponse.json(
        { error: 'Dinner not found' },
        { status: 404 }
      )
    }

    // Check if user is the host, moderator, or admin
    const isHost = dinner.hostId === user.id
    const isModerator = hasRole(user, 'MODERATOR')
    const isAdmin = user.role === 'ADMIN'

    if (!isHost && !isModerator && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // If moderator is updating, they can only moderate, not edit content
    if (isModerator && !isHost) {
      return NextResponse.json(
        { error: 'Moderators can only moderate dinners, not edit them' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = dinnerUpdateSchema.parse(body)

    const updatedDinner = await prisma.dinner.update({
      where: { id },
      data: {
        ...validatedData,
        dateTime: validatedData.dateTime ? new Date(validatedData.dateTime) : undefined,
        tags: validatedData.tagIds ? {
          deleteMany: {},
          create: validatedData.tagIds.map((tagId) => ({
            tagId,
          })),
        } : undefined,
      },
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
      },
    })

    return NextResponse.json({ dinner: updatedDinner })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    console.error('Error updating dinner:', error)
    return NextResponse.json(
      { error: 'Failed to update dinner' },
      { status: 500 }
    )
  }
})

/**
 * Delete a dinner listing
 * DELETE /api/dinners/[id]
 */
export const DELETE = withAuth(async (
  req: NextRequest,
  user,
  context?: { params?: Promise<{ [key: string]: string }> }
) => {
  try {
    const params = await context?.params
    const id = params?.id
    if (!id) {
      return NextResponse.json(
        { error: 'Dinner ID is required' },
        { status: 400 }
      )
    }
    
    const dinner = await prisma.dinner.findUnique({
      where: { id },
    })

    if (!dinner) {
      return NextResponse.json(
        { error: 'Dinner not found' },
        { status: 404 }
      )
    }

    // Check if user is the host, moderator, or admin
    const isHost = dinner.hostId === user.id
    const isModerator = hasRole(user, 'MODERATOR')
    const isAdmin = user.role === 'ADMIN'

    if (!isHost && !isModerator && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Only host or admin can delete, moderators cannot
    if (isModerator && !isHost && !isAdmin) {
      return NextResponse.json(
        { error: 'Moderators cannot delete dinners' },
        { status: 403 }
      )
    }

    await prisma.dinner.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dinner:', error)
    return NextResponse.json(
      { error: 'Failed to delete dinner' },
      { status: 500 }
    )
  }
})
