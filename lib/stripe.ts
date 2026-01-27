import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

/**
 * Stripe client instance
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
})

/**
 * Create a payment intent for a booking
 * @param amount - Amount in cents (EUR)
 * @param metadata - Additional metadata to attach to the payment intent
 * @returns Promise resolving to the payment intent
 */
export async function createPaymentIntent(
  amount: number,
  metadata: Record<string, string> = {}
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert EUR to cents
      currency: 'eur',
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return paymentIntent
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

/**
 * Retrieve a payment intent by ID
 * @param paymentIntentId - The payment intent ID
 * @returns Promise resolving to the payment intent
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error('Error retrieving payment intent:', error)
    throw error
  }
}

/**
 * Confirm a payment intent
 * @param paymentIntentId - The payment intent ID
 * @returns Promise resolving to the confirmed payment intent
 */
export async function confirmPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error('Error confirming payment intent:', error)
    throw error
  }
}
