'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, Calendar, Users, Clock, MapPin, Check, X, Mail, Edit } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface Invitation {
  id: string
  email: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
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
  invitations: Invitation[]
  _count: {
    invitations: number
    bookings: number
  }
}

interface Stats {
  total: number
  upcoming: number
  pendingRsvps: number
}

export default function EventsDashboardPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, upcoming: 0, pendingRsvps: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || [])
        setStats(data.stats || { total: 0, upcoming: 0, pendingRsvps: 0 })
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching events:', err)
        setLoading(false)
      })
  }, [])

  const getRsvpSummary = (invitations: Invitation[]) => {
    const accepted = invitations.filter((i) => i.status === 'ACCEPTED').length
    const pending = invitations.filter((i) => i.status === 'PENDING').length
    const declined = invitations.filter((i) => i.status === 'DECLINED').length
    return { accepted, pending, declined }
  }

  const isUpcoming = (dateTime: string) => new Date(dateTime) > new Date()

  if (loading) {
    return <LoadingScreen title="Loading your events" subtitle="Fetching your private events" />
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">My Events</h1>
            <p className="mt-2 text-[var(--foreground-secondary)]">
              Create and manage private events for friends and family
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard/events/new')} leftIcon={<Plus className="w-4 h-4" />}>
            Create Event
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-coral-100 dark:bg-coral-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-coral-600 dark:text-coral-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{stats.upcoming}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">Upcoming events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{stats.pendingRsvps}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">Pending RSVPs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">Total events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-coral-100 dark:bg-coral-900/30 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-coral-600 dark:text-coral-400" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No events yet</h3>
              <p className="text-[var(--foreground-muted)] mb-6 max-w-md mx-auto">
                Create your first private event to invite friends and family to a dinner gathering.
              </p>
              <Button onClick={() => router.push('/dashboard/events/new')} leftIcon={<Plus className="w-4 h-4" />}>
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const rsvp = getRsvpSummary(event.invitations)
              const upcoming = isUpcoming(event.dateTime)

              return (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                  onClick={() => router.push(`/dashboard/events/${event.id}`)}
                >
                  {event.imageUrl && (
                    <div className="h-32 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                      <span
                        className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                          upcoming
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)]'
                        }`}
                      >
                        {upcoming ? 'Upcoming' : 'Past'}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      {format(new Date(event.dateTime), 'EEEE, MMM d \'at\' h:mm a')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-[var(--foreground-muted)] mb-4">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{event.location}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {rsvp.accepted} / {event.maxGuests} confirmed
                      </p>
                      {event.basePricePerPerson > 0 && (
                        <p className="text-coral-600 dark:text-coral-400 font-medium">
                          Cost: {event.basePricePerPerson} per person
                        </p>
                      )}
                    </div>

                    {/* RSVP Summary */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Check className="h-3 w-3" />
                        {rsvp.accepted}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        {rsvp.pending}
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <X className="h-3 w-3" />
                        {rsvp.declined}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/events/${event.id}/invite`)
                        }}
                        leftIcon={<Mail className="h-3 w-3" />}
                      >
                        Invite
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/events/${event.id}/edit`)
                        }}
                        leftIcon={<Edit className="h-3 w-3" />}
                      >
                        Modify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/events/${event.id}`)
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
