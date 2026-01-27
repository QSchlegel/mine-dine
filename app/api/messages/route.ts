import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { messageCreateSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

/**
 * Send a message
 * POST /api/messages
 */
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const validatedData = messageCreateSchema.parse(body)

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: validatedData.recipientId },
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // If bookingId is provided, verify it exists and user has access
    if (validatedData.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: validatedData.bookingId },
        include: {
          dinner: true,
        },
      })

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }

      // Check if user is involved in the booking
      if (booking.userId !== user.id && booking.dinner.hostId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId: validatedData.recipientId,
        bookingId: validatedData.bookingId,
        content: validatedData.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
})

/**
 * Get messages for current user
 * GET /api/messages?userId=... (conversation with specific user)
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const otherUserId = searchParams.get('userId')

    if (otherUserId) {
      // Get conversation with specific user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: user.id, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: user.id },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      return NextResponse.json({ messages })
    } else {
      // Get all conversations
      const conversations = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: user.id },
            { recipientId: user.id },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true,
            },
          },
          recipient: {
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
        distinct: ['senderId', 'recipientId'],
      })

      return NextResponse.json({ conversations })
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
})
