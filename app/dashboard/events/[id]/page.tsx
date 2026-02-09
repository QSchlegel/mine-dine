'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Check,
  X,
  Edit,
  Mail,
  Trash2,
  CalendarClock,
  Loader2,
  Copy,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface Invitation {
  id: string
  email: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  token: string
}

interface Event {
  id: string
  title: string
  description: string
  dateTime: string
  location: string
  maxGuests: number
  basePricePerPerson: number
  status: string
  imageUrl: string | null
  visibility: string
  invitations: Invitation[]
  host: {
    id: string
    name: string | null
  }
  _count: {
    invitations: number
    bookings: number
  }
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reschedule modal state
  const [showReschedule, setShowReschedule] = useState(false)
  const [newDateTime, setNewDateTime] = useState('')
  const [notifyGuests, setNotifyGuests] = useState(true)
  const [resetRsvps, setResetRsvps] = useState(true)
  const [rescheduling, setRescheduling] = useState(false)

  // Cancel confirmation
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const fetchEvent = async () => {
    const res = await fetch(`/api/dinners/${eventId}`, { cache: 'no-store' })
    if (!res.ok) {
      if (res.status === 404) throw new Error('Event not found')
      if (res.status === 403) throw new Error('You do not have access to this event')
      throw new Error('Failed to load event')
    }
    const data = await res.json()
    setEvent(data.dinner)
    setNewDateTime(new Date(data.dinner.dateTime).toISOString().slice(0, 16))
    return data.dinner
  }

  const fetchInvitations = async () => {
    const res = await fetch(`/api/dinners/${eventId}/invitations`, { cache: 'no-store' })
    const data = await res.json()
    if (res.ok) setInvitations(data.invitations ?? [])
  }

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all([
      fetchEvent().catch((err) => {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        return null
      }),
      fetchInvitations(),
    ]).finally(() => setLoading(false))
  }, [eventId])

  const handleReschedule = async () => {
    if (!newDateTime) return
    setRescheduling(true)

    try {
      const res = await fetch(`/api/dinners/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateTime: new Date(newDateTime).toISOString(),
          notifyGuests,
          resetRsvps,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reschedule')
      }

      await Promise.all([fetchEvent(), fetchInvitations()])
      setShowReschedule(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule')
    } finally {
      setRescheduling(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)

    try {
      const res = await fetch(`/api/dinners/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to cancel event')
      }

      router.push('/dashboard/events')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
      setCancelling(false)
    }
  }

  const copyShareLink = async () => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/dinners/${eventId}`
    await navigator.clipboard.writeText(link)
  }

  if (loading) {
    return <LoadingScreen title="Loading event" subtitle="Fetching event details" />
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-[var(--foreground-secondary)] mb-4">{error || 'Event not found'}</p>
            <Button href="/dashboard/events" variant="secondary">
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const accepted = invitations.filter((i) => i.status === 'ACCEPTED')
  const pending = invitations.filter((i) => i.status === 'PENDING')
  const declined = invitations.filter((i) => i.status === 'DECLINED')
  const isUpcoming = new Date(event.dateTime) > new Date()
  const isCancelled = event.status === 'CANCELLED'

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to events
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[var(--foreground)]">{event.title}</h1>
                {isCancelled && (
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    Cancelled
                  </span>
                )}
                {!isCancelled && !isUpcoming && (
                  <span className="px-2 py-1 text-xs rounded-full bg-[var(--background-secondary)] text-[var(--foreground-secondary)]">
                    Past
                  </span>
                )}
              </div>
              <p className="text-[var(--foreground-secondary)]">
                {format(new Date(event.dateTime), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
              </p>
            </div>

            {!isCancelled && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/events/${eventId}/edit`)}
                  leftIcon={<Edit className="h-4 w-4" />}
                >
                  Modify
                </Button>
                {isUpcoming && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReschedule(true)}
                    leftIcon={<CalendarClock className="h-4 w-4" />}
                  >
                    Reschedule
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/events/${eventId}/invite`)}
                  leftIcon={<Mail className="h-4 w-4" />}
                >
                  Invite
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Reschedule Modal */}
        {showReschedule && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Reschedule Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    New Date & Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={newDateTime}
                    onChange={(e) => setNewDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={resetRsvps}
                      onChange={(e) => setResetRsvps(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] text-coral-500"
                    />
                    <span className="text-sm text-[var(--foreground)]">
                      Reset all RSVPs (guests must re-confirm)
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={notifyGuests}
                      onChange={(e) => setNotifyGuests(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--border)] text-coral-500"
                    />
                    <span className="text-sm text-[var(--foreground)]">
                      Notify all guests via email
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowReschedule(false)}
                    disabled={rescheduling}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReschedule}
                    disabled={rescheduling || !newDateTime}
                    className="flex-1"
                  >
                    {rescheduling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirm
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cancel Confirmation */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Cancel Event?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[var(--foreground-secondary)]">
                  Are you sure you want to cancel this event? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                    className="flex-1"
                  >
                    Keep Event
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    {cancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Cancel Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.imageUrl && (
                  <div className="rounded-lg overflow-hidden mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProxiedImageUrl(event.imageUrl) ?? event.imageUrl}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <p className="text-[var(--foreground-secondary)]">{event.description}</p>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.dateTime), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(event.dateTime), 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                    <Users className="h-4 w-4" />
                    <span>Up to {event.maxGuests} guests</span>
                  </div>
                </div>

                {event.basePricePerPerson > 0 && (
                  <div className="pt-2 text-coral-600 dark:text-coral-400 font-medium">
                    Cost: ${event.basePricePerPerson} per person
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guest List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Guest List</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/events/${eventId}/invite`)}
                  >
                    Manage Invites
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[var(--foreground-muted)] mb-4">No guests invited yet</p>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/dashboard/events/${eventId}/invite`)}
                    >
                      Invite Guests
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-secondary)]"
                      >
                        <span className="text-[var(--foreground)]">{inv.email}</span>
                        <span
                          className={`flex items-center gap-1 text-sm ${
                            inv.status === 'ACCEPTED'
                              ? 'text-green-600 dark:text-green-400'
                              : inv.status === 'DECLINED'
                              ? 'text-red-500'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {inv.status === 'ACCEPTED' && <Check className="h-4 w-4" />}
                          {inv.status === 'DECLINED' && <X className="h-4 w-4" />}
                          {inv.status === 'PENDING' && <Clock className="h-4 w-4" />}
                          {inv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">RSVP Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                      <Check className="h-4 w-4 text-green-500" />
                      Confirmed
                    </span>
                    <span className="font-semibold text-[var(--foreground)]">{accepted.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Pending
                    </span>
                    <span className="font-semibold text-[var(--foreground)]">{pending.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                      <X className="h-4 w-4 text-red-500" />
                      Declined
                    </span>
                    <span className="font-semibold text-[var(--foreground)]">{declined.length}</span>
                  </div>
                  <div className="border-t border-[var(--border)] pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--foreground)]">Total Invited</span>
                      <span className="font-semibold text-[var(--foreground)]">
                        {invitations.length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!isCancelled && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/dashboard/events/${eventId}/edit`)}
                    leftIcon={<Edit className="h-4 w-4" />}
                  >
                    Modify Event
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={copyShareLink}
                  leftIcon={<Copy className="h-4 w-4" />}
                >
                  Copy Event Link
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  href={`/api/events/${eventId}/calendar?format=ics`}
                  leftIcon={<Calendar className="h-4 w-4" />}
                >
                  Download Calendar File
                </Button>
                {isUpcoming && !isCancelled && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    onClick={() => setShowCancelConfirm(true)}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    Cancel Event
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
