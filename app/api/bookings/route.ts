import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { bookingCreateSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'
import { createPaymentIntent } from '@/lib/stripe'
import { validateReferralCode } from '@/lib/moderator'

/**
 * Create a new booking
 * POST /api/bookings
 */
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const validatedData = bookingCreateSchema.parse(body)

    // Get dinner details
    const dinner = await prisma.dinner.findUnique({
      where: { id: validatedData.dinnerId },
      include: {
        addOns: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ['PENDING', 'CONFIRMED'],
                },
              },
            },
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

    if (dinner.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Dinner is not available for booking' },
        { status: 400 }
      )
    }

    // Check availability
    const currentBookings = dinner._count.bookings
    if (currentBookings + validatedData.numberOfGuests > dinner.maxGuests) {
      return NextResponse.json(
        { error: 'Not enough spots available' },
        { status: 400 }
      )
    }

    // Calculate prices
    const basePrice = dinner.basePricePerPerson * validatedData.numberOfGuests
    let addOnsTotal = 0

    if (validatedData.selectedAddOns && validatedData.selectedAddOns.length > 0) {
      for (const selectedAddOn of validatedData.selectedAddOns) {
        const addOn = dinner.addOns.find((a: { id: string }) => a.id === selectedAddOn.addOnId)
        if (addOn) {
          addOnsTotal += addOn.price * selectedAddOn.quantity
        }
      }
    }

    const totalPrice = basePrice + addOnsTotal

    // Validate referral code if provided
    let referralCodeUsed: string | null = null
    if (validatedData.referralCode) {
      const moderator = await validateReferralCode(validatedData.referralCode)
      if (!moderator) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        )
      }
      referralCodeUsed = validatedData.referralCode
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        dinnerId: validatedData.dinnerId,
        numberOfGuests: validatedData.numberOfGuests,
        basePrice,
        addOnsTotal,
        totalPrice,
        selectedAddOns: validatedData.selectedAddOns || [],
        referralCodeUsed,
        status: 'PENDING',
      },
    })

    // Create payment intent
    const paymentIntent = await createPaymentIntent(totalPrice, {
      bookingId: booking.id,
      userId: user.id,
      dinnerId: validatedData.dinnerId,
    })

    // Update booking with payment intent ID
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    return NextResponse.json({
      booking: updatedBooking,
      clientSecret: paymentIntent.client_secret,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
})

/**
 * Get user's bookings
 * GET /api/bookings
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      include: {
        dinner: {
          include: {
            host: {
              select: {
                id: true,
                name: true,
                profileImageUrl: true,
              },
            },
          },
        },
        review: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
})
