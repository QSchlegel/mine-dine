'use client'

import { useState, useEffect, use } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Euro,
  ChefHat,
  MessageCircle,
  CalendarPlus,
  Download,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface Booking {
  id: string
  status: string
  numberOfGuests: number
  basePrice: number
  addOnsTotal: number
  totalPrice: number
  selectedAddOns: Array<{ addOnId: string; quantity: number }> | null
  createdAt: string
  dinner: {
    id: string
    title: string
    description: string
    cuisine: string | null
    location: string
    dateTime: string
    imageUrl: string | null
    host: {
      id: string
      name: string | null
      profileImageUrl: string | null
    }
    addOns: Array<{
      id: string
      name: string
      price: number
    }>
  }
}

export default function BookingConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${resolvedParams.id}`)
        if (!res.ok) {
          throw new Error('Booking not found')
        }
        const data = await res.json()
        setBooking(data.booking)

        // Trigger confetti on successful load
        if (data.booking.status === 'CONFIRMED') {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#EC4899', '#06B6D4', '#FFD700'],
            })
          }, 500)
        }
      } catch (err) {
        console.error('Error fetching booking:', err)
        setError('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [resolvedParams.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const addToCalendar = () => {
    if (!booking) return

    const startDate = new Date(booking.dinner.dateTime)
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000) // 3 hours

    const formatForICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatForICS(startDate)}
DTEND:${formatForICS(endDate)}
SUMMARY:${booking.dinner.title}
DESCRIPTION:Dinner with ${booking.dinner.host.name || 'host'} at Mine Dine
LOCATION:${booking.dinner.location}
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `minedine-${booking.dinner.title.replace(/\s+/g, '-').toLowerCase()}.ics`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <LoadingScreen title="Loading confirmation" subtitle="Finalizing your booking" />
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Booking Not Found</h2>
            <p className="text-foreground-secondary mb-6">
              {error || "We couldn't find this booking."}
            </p>
            <Link href="/dashboard/bookings">
              <Button>View All Bookings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPending = booking.status === 'PENDING'
  const isConfirmed = booking.status === 'CONFIRMED'

  // Find selected add-on names
  const selectedAddOnDetails = booking.selectedAddOns?.map(sa => {
    const addOn = booking.dinner.addOns.find(a => a.id === sa.addOnId)
    return addOn ? { ...addOn, quantity: sa.quantity } : null
  }).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Success header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isConfirmed
                ? 'bg-success-100 dark:bg-success-900/20'
                : 'bg-warning-100 dark:bg-warning-900/20'
            }`}
          >
            {isConfirmed ? (
              <CheckCircle className="w-10 h-10 text-success-500" />
            ) : (
              <Loader2 className="w-10 h-10 text-warning-500 animate-spin" />
            )}
          </motion.div>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isConfirmed ? 'Booking Confirmed!' : 'Payment Processing'}
          </h1>
          <p className="text-foreground-secondary">
            {isConfirmed
              ? "Your seat at the table is secured. Get ready for a delicious experience!"
              : "We're processing your payment. You'll receive a confirmation shortly."}
          </p>
        </motion.div>

        {/* Booking details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            {/* Dinner image */}
            {booking.dinner.imageUrl && (
              <div className="relative h-48 w-full">
                <Image
                  src={booking.dinner.imageUrl}
                  alt={booking.dinner.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-xl font-bold text-white">{booking.dinner.title}</h2>
                  {booking.dinner.cuisine && (
                    <p className="text-white/80 text-sm">{booking.dinner.cuisine}</p>
                  )}
                </div>
              </div>
            )}

            <CardContent className="p-6 space-y-6">
              {/* Host info */}
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="relative h-14 w-14 rounded-full overflow-hidden bg-primary-100">
                  {booking.dinner.host.profileImageUrl ? (
                    <Image
                      src={booking.dinner.host.profileImageUrl}
                      alt={booking.dinner.host.name || 'Host'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="w-7 h-7 text-primary-500" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">Hosted by</p>
                  <p className="font-medium text-foreground">
                    {booking.dinner.host.name || 'Anonymous Host'}
                  </p>
                </div>
              </div>

              {/* Event details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-foreground">
                  <Calendar className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{formatDate(booking.dinner.dateTime)}</p>
                    <p className="text-sm text-foreground-secondary">
                      {formatTime(booking.dinner.dateTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-foreground">
                  <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <p>{booking.dinner.location}</p>
                </div>

                <div className="flex items-center gap-3 text-foreground">
                  <Users className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <p>{booking.numberOfGuests} guest{booking.numberOfGuests !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="pt-4 border-t border-border">
                <h3 className="font-medium text-foreground mb-3">Price Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">
                      Base price × {booking.numberOfGuests} guest{booking.numberOfGuests !== 1 ? 's' : ''}
                    </span>
                    <span className="text-foreground">€{booking.basePrice.toFixed(2)}</span>
                  </div>

                  {selectedAddOnDetails.length > 0 && (
                    <>
                      {selectedAddOnDetails.map((addOn: any) => (
                        <div key={addOn.id} className="flex justify-between">
                          <span className="text-foreground-secondary">
                            {addOn.name} × {addOn.quantity}
                          </span>
                          <span className="text-foreground">
                            €{(addOn.price * addOn.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  <div className="flex justify-between pt-2 border-t border-border font-medium">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary-500 text-lg">
                      €{booking.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking reference */}
              <div className="p-3 bg-background-secondary rounded-lg">
                <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">
                  Booking Reference
                </p>
                <p className="font-mono text-foreground">{booking.id}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={addToCalendar}
              className="w-full"
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>

            <Link href={`/dashboard/messages?userId=${booking.dinner.host.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Host
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href={`/dinners/${booking.dinner.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                View Dinner Details
              </Button>
            </Link>

            <Link href="/dashboard/bookings" className="w-full">
              <Button className="w-full">
                View All Bookings
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* What's next section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium text-foreground mb-4">What&apos;s Next?</h3>
              <ul className="space-y-3 text-sm text-foreground-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                  <span>You&apos;ll receive a confirmation email with all the details</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                  <span>The host will share the exact address closer to the date</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                  <span>Feel free to message the host with any dietary requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                  <span>After the dinner, leave a review to help other guests</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
