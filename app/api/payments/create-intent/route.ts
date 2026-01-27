import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createPaymentIntent } from '@/lib/stripe'
import { z } from 'zod'

const createIntentSchema = z.object({
  amount: z.number().positive(),
  bookingId: z.string().optional(),
  dinnerId: z.string().optional(),
})

/**
 * Create a Stripe payment intent
 * POST /api/payments/create-intent
 */
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const validatedData = createIntentSchema.parse(body)

    const metadata: Record<string, string> = {
      userId: user.id,
    }

    if (validatedData.bookingId) {
      metadata.bookingId = validatedData.bookingId
    }

    if (validatedData.dinnerId) {
      metadata.dinnerId = validatedData.dinnerId
    }

    const paymentIntent = await createPaymentIntent(validatedData.amount, metadata)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
