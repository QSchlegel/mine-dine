import Stripe from 'stripe'

let _stripe: Stripe | null = null

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    // IMPORTANT: do not throw at module-eval time; Next build/imports API routes.
    // Throw only when the Stripe functionality is actually invoked.
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return _stripe
}

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
    const paymentIntent = await getStripe().paymentIntents.create({
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
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId)
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
export function constructStripeEvent(body: string, signature: string, webhookSecret: string) {
  return getStripe().webhooks.constructEvent(body, signature, webhookSecret)
}

export async function confirmPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await getStripe().paymentIntents.confirm(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error('Error confirming payment intent:', error)
    throw error
  }
}
