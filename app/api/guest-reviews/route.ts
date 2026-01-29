import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { guestReviewCreateSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Create a guest review (host reviewing a guest)
 * POST /api/guest-reviews
 *
 * Request body:
 * - bookingId: string - The booking ID
 * - sentiment: 'LIKE' | 'DISLIKE' - Host's sentiment about the guest
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const validatedData = guestReviewCreateSchema.parse(body)

    // Get booking and verify host owns the dinner
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        dinner: {
          select: {
            id: true,
            hostId: true,
          },
        },
        guestReview: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify the current user is the host of the dinner
    if (booking.dinner.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can review guests' },
        { status: 403 }
      )
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Can only review guests after dinner is completed' },
        { status: 400 }
      )
    }

    if (booking.guestReview) {
      return NextResponse.json(
        { error: 'Guest already reviewed for this booking' },
        { status: 400 }
      )
    }

    const guestReview = await prisma.guestReview.create({
      data: {
        bookingId: validatedData.bookingId,
        hostId: user.id,
        guestId: booking.userId,
        dinnerId: booking.dinnerId,
        sentiment: validatedData.sentiment,
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ guestReview }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    console.error('Error creating guest review:', error)
    return NextResponse.json(
      { error: 'Failed to create guest review' },
      { status: 500 }
    )
  }
})

/**
 * Get guest reviews/reputation
 * GET /api/guest-reviews?guestId=...
 *
 * Returns aggregate stats for a guest's reputation
 */
export const GET = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const guestId = searchParams.get('guestId')

    if (!guestId) {
      return NextResponse.json(
        { error: 'guestId is required' },
        { status: 400 }
      )
    }

    // Get all reviews for this guest
    const reviews = await prisma.guestReview.findMany({
      where: { guestId },
      select: {
        sentiment: true,
      },
    })

    const likes = reviews.filter((r) => r.sentiment === 'LIKE').length
    const dislikes = reviews.filter((r) => r.sentiment === 'DISLIKE').length
    const total = reviews.length
    const likePercentage = total > 0 ? Math.round((likes / total) * 100) : 0

    return NextResponse.json({
      reputation: {
        likes,
        dislikes,
        total,
        likePercentage,
      },
    })
  } catch (error) {
    console.error('Error fetching guest reputation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guest reputation' },
      { status: 500 }
    )
  }
}
