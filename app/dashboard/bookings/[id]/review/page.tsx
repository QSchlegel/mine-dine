'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { StarDistributor, StarDistribution } from '@/components/reviews/StarDistributor'
import { TipStarsPurchase } from '@/components/reviews/TipStarsPurchase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { motion, AnimatePresence } from 'framer-motion'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Booking {
  id: string
  totalPrice: number
  dinner: {
    id: string
    title: string
    imageUrl?: string
    host: {
      name: string
      profileImageUrl?: string
    }
  }
}

interface TipPaymentFormProps {
  onPaymentComplete: (paymentIntentId: string) => void
  onCancel: () => void
}

function TipPaymentForm({ onPaymentComplete, onCancel }: TipPaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    })

    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setProcessing(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaymentComplete(paymentIntent.id)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button type="submit" isLoading={processing} disabled={!stripe} className="flex-1">
          Pay Tip
        </Button>
      </div>
    </form>
  )
}

export default function ReviewBookingPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Review state
  const [distribution, setDistribution] = useState<StarDistribution>({
    hospitality: 0,
    cleanliness: 0,
    taste: 0,
  })
  const [tipStars, setTipStars] = useState(0)
  const [comment, setComment] = useState('')

  // Payment state
  const [showPayment, setShowPayment] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [tipPaymentIntentId, setTipPaymentIntentId] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const totalStars = distribution.hospitality + distribution.cleanliness + distribution.taste
  const expectedStars = 5 + tipStars
  const canSubmit = totalStars === expectedStars && (tipStars === 0 || tipPaymentIntentId)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/bookings`)
        .then((res) => res.json())
        .then((data) => {
          const foundBooking = data.bookings?.find((b: any) => b.id === params.id)
          if (foundBooking) {
            setBooking(foundBooking)
          }
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error fetching booking:', err)
          setLoading(false)
        })
    }
  }, [params.id])

  const handleTipStarsChange = async (stars: number) => {
    setTipStars(stars)
    setTipPaymentIntentId(null)
    setClientSecret(null)

    if (stars > 0) {
      setPaymentLoading(true)
      try {
        const response = await fetch('/api/reviews/tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking!.id,
            tipStars: stars,
          }),
        })
        const data = await response.json()
        if (response.ok) {
          setClientSecret(data.clientSecret)
        } else {
          setError(data.error || 'Failed to create tip payment')
        }
      } catch {
        setError('Failed to create tip payment')
      } finally {
        setPaymentLoading(false)
      }
    }
  }

  const handlePaymentComplete = (paymentIntentId: string) => {
    setTipPaymentIntentId(paymentIntentId)
    setShowPayment(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !booking) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          hospitalityStars: distribution.hospitality,
          cleanlinessStars: distribution.cleanliness,
          tasteStars: distribution.taste,
          tipStars,
          tipPaymentIntentId: tipPaymentIntentId || undefined,
          comment: comment || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      router.push(`/dinners/${booking.dinner.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingScreen title="Loading review" subtitle="Preparing your booking details" />
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Booking not found</h1>
          <Button onClick={() => router.push('/dashboard/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Your Experience</CardTitle>
            <CardDescription>
              Share your feedback for {booking.dinner.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {booking.dinner.imageUrl && (
                <img
                  src={booking.dinner.imageUrl}
                  alt={booking.dinner.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  {booking.dinner.title}
                </p>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  Hosted by {booking.dinner.host.name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tip Stars (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add a Tip (Optional)</CardTitle>
            <CardDescription>
              Purchase extra stars to give a more detailed review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TipStarsPurchase
              bookingTotalPrice={booking.totalPrice}
              tipStars={tipStars}
              onTipStarsChange={handleTipStarsChange}
              isPaid={!!tipPaymentIntentId}
              disabled={paymentLoading}
            />

            <AnimatePresence>
              {tipStars > 0 && !tipPaymentIntentId && clientSecret && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  {!showPayment ? (
                    <Button
                      onClick={() => setShowPayment(true)}
                      className="w-full"
                      disabled={paymentLoading}
                    >
                      Pay for {tipStars} Tip Star{tipStars !== 1 && 's'}
                    </Button>
                  ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <TipPaymentForm
                        onPaymentComplete={handlePaymentComplete}
                        onCancel={() => setShowPayment(false)}
                      />
                    </Elements>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Star Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribute Your Stars</CardTitle>
            <CardDescription>
              You have {5 + tipStars} stars to distribute across categories.
              Each category can have up to 5 stars.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StarDistributor
              distribution={distribution}
              tipStars={tipStars}
              onDistributionChange={setDistribution}
              disabled={submitting}
            />
          </CardContent>
        </Card>

        {/* Comment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Comments (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Share more details about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              showCount
              disabled={submitting}
            />
          </CardContent>
        </Card>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          isLoading={submitting}
          disabled={!canSubmit}
          className="w-full"
          size="lg"
        >
          Submit Review
        </Button>

        {!canSubmit && totalStars !== expectedStars && (
          <p className="text-sm text-center text-amber-500">
            Please distribute all {expectedStars} stars before submitting
          </p>
        )}

        {!canSubmit && tipStars > 0 && !tipPaymentIntentId && (
          <p className="text-sm text-center text-amber-500">
            Please complete tip payment before submitting
          </p>
        )}
      </div>
    </div>
  )
}
