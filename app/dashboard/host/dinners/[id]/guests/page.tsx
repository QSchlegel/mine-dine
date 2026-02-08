'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { GuestSentiment, Sentiment } from '@/components/reviews/GuestSentiment'
import { Avatar } from '@/components/ui/Avatar'
import { motion, AnimatePresence } from 'framer-motion'

interface Guest {
  id: string
  name: string
  profileImageUrl?: string
}

interface BookingWithGuest {
  id: string
  userId: string
  status: string
  numberOfGuests: number
  user: Guest
  review?: {
    hospitalityStars: number
    cleanlinessStars: number
    tasteStars: number
    tipAmount: number
    comment?: string
  }
  guestReview?: {
    sentiment: Sentiment
  }
}

interface Dinner {
  id: string
  title: string
  dateTime: string
  bookings: BookingWithGuest[]
}

export default function HostGuestReviewPage() {
  const params = useParams()
  const router = useRouter()
  const [dinner, setDinner] = useState<Dinner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingBookingId, setSubmittingBookingId] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchDinnerWithGuests()
    }
  }, [params.id])

  const fetchDinnerWithGuests = async () => {
    try {
      const response = await fetch(`/api/dinners/${params.id}?includeBookings=true`)
      const data = await response.json()

      if (response.ok) {
        setDinner(data.dinner)
      } else {
        setError(data.error || 'Failed to load dinner')
      }
    } catch {
      setError('Failed to load dinner')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestReview = async (bookingId: string, sentiment: Sentiment) => {
    setSubmittingBookingId(bookingId)
    setError(null)

    try {
      const response = await fetch('/api/guest-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, sentiment }),
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state
        setDinner((prev) => {
          if (!prev) return null
          return {
            ...prev,
            bookings: prev.bookings.map((b) =>
              b.id === bookingId
                ? { ...b, guestReview: { sentiment } }
                : b
            ),
          }
        })
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } catch {
      setError('Failed to submit review')
    } finally {
      setSubmittingBookingId(null)
    }
  }

  if (loading) {
    return <LoadingScreen title="Loading guests" subtitle="Fetching dinner attendees" />
  }

  if (!dinner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dinner not found</h1>
          <Button onClick={() => router.push('/dashboard/host/dinners')}>
            Back to Dinners
          </Button>
        </div>
      </div>
    )
  }

  const completedBookings = dinner.bookings.filter((b) => b.status === 'COMPLETED')

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Review Your Guests
          </h1>
          <p className="text-[var(--foreground-secondary)] mt-1">
            {dinner.title} - {new Date(dinner.dateTime).toLocaleDateString()}
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/host/dinners/${params.id}/invite`)}
            >
              Invite guests
            </Button>
          </div>
        </div>

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

        {/* Guest list */}
        {completedBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-[var(--foreground-secondary)]">
                No completed bookings to review yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {completedBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Guest info */}
                    <Avatar
                      src={booking.user.profileImageUrl}
                      alt={booking.user.name || 'Guest'}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {booking.user.name || 'Anonymous Guest'}
                      </h3>
                      <p className="text-sm text-[var(--foreground-secondary)]">
                        {booking.numberOfGuests} guest{booking.numberOfGuests !== 1 && 's'}
                      </p>

                      {/* Their review of you */}
                      {booking.review && (
                        <div className="mt-3 p-3 rounded-lg bg-[var(--background-secondary)]">
                          <p className="text-xs font-medium text-[var(--foreground-secondary)] mb-2">
                            Their review of your dinner:
                          </p>
                          <div className="flex gap-4 text-sm">
                            <span>🤝 {booking.review.hospitalityStars}/5</span>
                            <span>✨ {booking.review.cleanlinessStars}/5</span>
                            <span>🍽️ {booking.review.tasteStars}/5</span>
                          </div>
                          {booking.review.tipAmount > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              +{booking.review.tipAmount.toFixed(2)} EUR tip
                            </p>
                          )}
                          {booking.review.comment && (
                            <p className="text-sm text-[var(--foreground-secondary)] mt-2 italic">
                              "{booking.review.comment}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Review actions */}
                    <div className="flex-shrink-0">
                      {booking.guestReview ? (
                        <div className="text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                              booking.guestReview.sentiment === 'LIKE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {booking.guestReview.sentiment === 'LIKE' ? '👍' : '👎'}
                            {booking.guestReview.sentiment === 'LIKE'
                              ? 'Great guest'
                              : 'Not great'}
                          </span>
                        </div>
                      ) : (
                        <GuestSentiment
                          onSelect={(sentiment) =>
                            handleGuestReview(booking.id, sentiment)
                          }
                          selected={null}
                          disabled={submittingBookingId === booking.id}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {completedBookings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {completedBookings.length}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    Total guests
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {completedBookings.filter((b) => b.guestReview?.sentiment === 'LIKE').length}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    Great guests
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {completedBookings.filter((b) => !b.guestReview).length}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    Pending review
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
