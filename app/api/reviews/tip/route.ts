import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { createPaymentIntent } from '@/lib/stripe'
import { calculateTipAmount, MAX_TIP_STARS } from '@/lib/reviews/tip'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const tipPaymentSchema = z.object({
  bookingId: z.string(),
  tipStars: z.number().int().min(1).max(MAX_TIP_STARS),
})

/**
 * Create a payment intent for tip stars
 * POST /api/reviews/tip
 *
 * Request body:
 * - bookingId: string - The booking ID to create tip for
 * - tipStars: number - Number of tip stars to purchase (1-10)
 *
 * Response:
 * - clientSecret: string - Stripe client secret for payment
 * - tipAmount: number - Tip amount in EUR
 * - starCost: number - Cost per star in EUR
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const validatedData = tipPaymentSchema.parse(body)

    // Check if booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        review: true,
        dinner: {
          select: {
            id: true,
            title: true,
            hostId: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Can only tip for completed bookings' },
        { status: 400 }
      )
    }

    if (booking.review) {
      return NextResponse.json(
        { error: 'Review already submitted for this booking' },
        { status: 400 }
      )
    }

    // Calculate tip amount
    const tipAmount = calculateTipAmount(booking.totalPrice, validatedData.tipStars)
    const starCost = booking.totalPrice * 0.01 // 1% per star

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(tipAmount, {
      type: 'review_tip',
      bookingId: validatedData.bookingId,
      dinnerId: booking.dinnerId,
      hostId: booking.dinner.hostId,
      guestId: user.id,
      tipStars: validatedData.tipStars.toString(),
    })

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        tipAmount,
        starCost,
        tipStars: validatedData.tipStars,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating tip payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create tip payment' },
      { status: 500 }
    )
  }
})
