'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { format } from 'date-fns'

interface Booking {
  id: string
  status: string
  numberOfGuests: number
  totalPrice: number
  createdAt: string
  dinner: {
    id: string
    title: string
    dateTime: string
    location: string
    host: {
      name: string | null
    }
  }
  review: {
    id: string
  } | null
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bookings')
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.bookings || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching bookings:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <LoadingScreen title="Loading bookings" subtitle="Fetching your reservations" />
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">My Bookings</h1>
          <p className="mt-2 text-[var(--foreground-secondary)]">View and manage your dinner reservations</p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-[var(--foreground-muted)] mb-4">You haven't made any bookings yet.</p>
              <Button onClick={() => router.push('/dinners')}>
                Browse Dinners
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{booking.dinner.title}</CardTitle>
                      <CardDescription>
                        {format(new Date(booking.dinner.dateTime), 'PPP p')}
                      </CardDescription>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-[var(--background-secondary)] text-[var(--foreground-secondary)]'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-[var(--foreground-muted)] mb-4">
                    <p>📍 {booking.dinner.location}</p>
                    <p>👤 Host: {booking.dinner.host.name || 'Anonymous'}</p>
                    <p>👥 {booking.numberOfGuests} guests</p>
                    <p className="text-lg font-semibold text-indigo-600">
                      €{booking.totalPrice.toFixed(2)} total
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dinners/${booking.dinner.id}`)}
                    >
                      View Dinner
                    </Button>
                    {booking.status === 'CONFIRMED' && !booking.review && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/bookings/${booking.id}/review`)}
                      >
                        Leave Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
