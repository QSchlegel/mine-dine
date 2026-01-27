import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { processRevenueSharesForBooking } from '@/lib/revenue-share'
import Stripe from 'stripe'

/**
 * Stripe webhook handler
 * Handles payment events from Stripe
 * POST /api/payments/webhook
 */
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata.bookingId

        if (bookingId) {
          // Update booking status to CONFIRMED
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              status: 'CONFIRMED',
              stripePaymentIntentId: paymentIntent.id,
            },
          })

          // Process revenue shares for moderators
          try {
            await processRevenueSharesForBooking(bookingId)
          } catch (error) {
            // Log error but don't fail the webhook
            console.error('Error processing revenue shares:', error)
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata.bookingId

        if (bookingId) {
          // Update booking status to CANCELLED on payment failure
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              status: 'CANCELLED',
            },
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
