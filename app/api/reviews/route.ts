import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { reviewCreateSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'
import { calculateTipAmount, validateStarDistribution } from '@/lib/reviews/tip'

/**
 * Create a review
 * POST /api/reviews
 */
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const validatedData = reviewCreateSchema.parse(body)

    // Check if booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        review: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Can only review completed bookings' },
        { status: 400 }
      )
    }

    if (booking.review) {
      return NextResponse.json(
        { error: 'Review already exists for this booking' },
        { status: 400 }
      )
    }

    // Validate star distribution
    const starValidation = validateStarDistribution(
      validatedData.hospitalityStars,
      validatedData.cleanlinessStars,
      validatedData.tasteStars,
      validatedData.tipStars
    )

    if (!starValidation.valid) {
      return NextResponse.json(
        { error: starValidation.error },
        { status: 400 }
      )
    }

    // If tip stars > 0, verify payment was made
    if (validatedData.tipStars > 0 && !validatedData.tipPaymentIntentId) {
      return NextResponse.json(
        { error: 'Tip payment is required for additional stars' },
        { status: 400 }
      )
    }

    // Calculate tip amount
    const tipAmount = calculateTipAmount(booking.totalPrice, validatedData.tipStars)

    const review = await prisma.review.create({
      data: {
        bookingId: validatedData.bookingId,
        userId: user.id,
        dinnerId: booking.dinnerId,
        hospitalityStars: validatedData.hospitalityStars,
        cleanlinessStars: validatedData.cleanlinessStars,
        tasteStars: validatedData.tasteStars,
        tipStars: validatedData.tipStars,
        tipAmount,
        tipPaymentIntentId: validatedData.tipPaymentIntentId,
        comment: validatedData.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
})

/**
 * Get reviews for a dinner
 * GET /api/reviews?dinnerId=...
 */
export const GET = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const dinnerId = searchParams.get('dinnerId')

    if (!dinnerId) {
      return NextResponse.json(
        { error: 'dinnerId is required' },
        { status: 400 }
      )
    }

    const reviews = await prisma.review.findMany({
      where: { dinnerId },
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
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
