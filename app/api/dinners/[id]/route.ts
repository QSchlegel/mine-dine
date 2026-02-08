import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { hasRole, getCurrentUser } from '@/lib/auth'
import { dinnerUpdateSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'
import { canAccessEvent } from '@/lib/permissions'
import { sendEmail } from '@/lib/email'

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
            invitations: true,
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

    // Draft dinners are only visible to the host (for preview)
    if (dinner.status === 'DRAFT') {
      const user = await getCurrentUser()
      if (user?.id !== dinner.hostId) {
        return NextResponse.json(
          { error: 'Dinner not found' },
          { status: 404 }
        )
      }
    }

    // Check access for private events (allow valid invite token without login)
    if (dinner.visibility === 'PRIVATE') {
      const user = await getCurrentUser()
      let hasAccess = await canAccessEvent(id, user?.id ?? null)
      if (!hasAccess) {
        const inviteToken = req.nextUrl.searchParams.get('invite')
        if (inviteToken) {
          const validInvite = await prisma.dinnerInvitation.findFirst({
            where: { dinnerId: id, token: inviteToken },
            select: { id: true },
          })
          if (validInvite) hasAccess = true
        }
      }
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'This event is private' },
          { status: 403 }
        )
      }
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
 *
 * When dateTime is changed (reschedule):
 * - Optionally reset invitation statuses to PENDING
 * - Optionally send notification emails to guests
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
      include: {
        invitations: {
          select: {
            id: true,
            email: true,
            status: true,
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
    const { notifyGuests, resetRsvps, ...updateData } = body
    const validatedData = dinnerUpdateSchema.parse(updateData)

    const isReschedule = validatedData.dateTime &&
      new Date(validatedData.dateTime).getTime() !== new Date(dinner.dateTime).getTime()

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

    // Handle reschedule: reset RSVPs and notify guests
    if (isReschedule && resetRsvps) {
      await prisma.dinnerInvitation.updateMany({
        where: { dinnerId: id },
        data: { status: 'PENDING' },
      })
    }

    // Send notification emails if requested
    if (isReschedule && notifyGuests && dinner.invitations.length > 0) {
      const newDate = new Date(validatedData.dateTime!).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })

      const hostName = user.name || 'Your host'
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      // Send emails in parallel
      await Promise.all(
        dinner.invitations.map(async (inv) => {
          const inviteUrl = `${baseUrl}/invitations/${inv.id}`
          await sendEmail({
            to: inv.email,
            subject: `Event Rescheduled: ${updatedDinner.title}`,
            html: `<p>${hostName} has rescheduled <strong>${updatedDinner.title}</strong>.</p>
              <p>New date: <strong>${newDate}</strong></p>
              <p>Please confirm your attendance: <a href="${inviteUrl}">Respond to invitation</a></p>`,
            text: `${hostName} has rescheduled ${updatedDinner.title}.\n\nNew date: ${newDate}\n\nPlease confirm your attendance: ${inviteUrl}`,
          })
        })
      )
    }

    return NextResponse.json({ dinner: updatedDinner, rescheduled: isReschedule })
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
