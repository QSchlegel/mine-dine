'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, MapPin, User, Check, X, ChevronDown, Download, ExternalLink } from 'lucide-react'
import { Container, Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'

interface DinnerSummary {
  id: string
  title: string
  description: string
  dateTime: string
  location: string
  cuisine: string | null
  maxGuests: number
  visibility?: string
  host: {
    id: string
    name: string | null
    profileImageUrl: string | null
  }
}

interface InvitationData {
  id: string
  email: string
  status: string
  dinner: DinnerSummary
}

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string
  const [data, setData] = useState<{ invitation: InvitationData } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responding, setResponding] = useState(false)
  const [responded, setResponded] = useState<string | null>(null)
  const [showCalendarMenu, setShowCalendarMenu] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Invalid invite link')
      return
    }
    fetch(`/api/invitations/${token}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Invalid or expired invite')
          throw new Error('Failed to load invitation')
        }
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const handleRespond = async (status: 'ACCEPTED' | 'DECLINED') => {
    if (!token || responding) return
    setResponding(true)
    setError(null)
    try {
      const res = await fetch(`/api/invitations/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to respond')
      setResponded(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setResponding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-pulse text-[var(--foreground-secondary)]">Loading invitation...</div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-[var(--foreground-secondary)] text-center mb-6">{error}</p>
            <Button href="/" variant="secondary" className="w-full">
              Go to Mine Dine
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const inv = data?.invitation
  if (!inv) return null

  const dinner = inv.dinner
  const hostName = dinner.host?.name ?? 'Your host'
  const dinnerDate = format(new Date(dinner.dateTime), 'EEEE, MMMM d, yyyy \'at\' h:mm a')
  const alreadyResponded = inv.status !== 'PENDING' || responded
  const hasAccepted = responded === 'ACCEPTED' || inv.status === 'ACCEPTED'
  const isPrivateEvent = dinner.visibility === 'PRIVATE'

  return (
    <div className="min-h-screen bg-[var(--background)] py-12">
      <Container>
        <div className="max-w-xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">You're invited!</CardTitle>
              <p className="text-[var(--foreground-secondary)] text-sm mt-1">
                {hostName} invited you to {isPrivateEvent ? 'a private event' : 'a dinner'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--foreground)]">{dinner.title}</h2>
                {dinner.cuisine && (
                  <p className="text-[var(--foreground-secondary)] text-sm mt-0.5">{dinner.cuisine}</p>
                )}
              </div>
              {dinner.description && (
                <p className="text-[var(--foreground-secondary)]">{dinner.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-[var(--foreground-secondary)]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {dinnerDate}
                </span>
                {dinner.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {dinner.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {hostName}
                </span>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              {alreadyResponded ? (
                <div className="pt-4 space-y-4">
                  {/* Confirmation Message */}
                  <div
                    className={`p-4 rounded-lg ${
                      hasAccepted
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-[var(--background-secondary)] border border-[var(--border)]'
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        hasAccepted
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-[var(--foreground)]'
                      }`}
                    >
                      {hasAccepted ? "You're going! See you there." : "Thanks for letting us know."}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        hasAccepted
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-[var(--foreground-secondary)]'
                      }`}
                    >
                      {hasAccepted
                        ? 'Add this event to your calendar so you don\'t forget.'
                        : 'We hope to see you at a future event!'}
                    </p>
                  </div>

                  {/* Calendar Export (only show if accepted) */}
                  {hasAccepted && (
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                        rightIcon={<ChevronDown className={`h-4 w-4 transition-transform ${showCalendarMenu ? 'rotate-180' : ''}`} />}
                        leftIcon={<Calendar className="h-4 w-4" />}
                      >
                        Add to Calendar
                      </Button>

                      {showCalendarMenu && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-10">
                          <a
                            href={`/api/events/${dinner.id}/calendar?format=google`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--background-secondary)] transition-colors"
                          >
                            <ExternalLink className="h-4 w-4 text-[var(--foreground-muted)]" />
                            <span className="text-[var(--foreground)]">Google Calendar</span>
                          </a>
                          <a
                            href={`/api/events/${dinner.id}/calendar?format=ics`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--background-secondary)] transition-colors border-t border-[var(--border)]"
                          >
                            <Download className="h-4 w-4 text-[var(--foreground-muted)]" />
                            <span className="text-[var(--foreground)]">Apple Calendar (.ics)</span>
                          </a>
                          <a
                            href={`/api/events/${dinner.id}/calendar?format=outlook`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--background-secondary)] transition-colors border-t border-[var(--border)]"
                          >
                            <ExternalLink className="h-4 w-4 text-[var(--foreground-muted)]" />
                            <span className="text-[var(--foreground)]">Outlook</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    href={`/dinners/${dinner.id}`}
                    variant="secondary"
                    className="w-full"
                  >
                    View Event Details
                  </Button>
                </div>
              ) : (
                <div className="pt-4 space-y-3">
                  {/* RSVP Buttons */}
                  <Button
                    onClick={() => handleRespond('ACCEPTED')}
                    disabled={responding}
                    className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
                    size="lg"
                    leftIcon={<Check className="h-5 w-5" />}
                  >
                    {responding ? 'Sending...' : "I can come!"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRespond('DECLINED')}
                    disabled={responding}
                    className="w-full"
                    leftIcon={<X className="h-4 w-4" />}
                  >
                    Can't make it
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-center text-sm text-[var(--foreground-secondary)]">
            <Button href="/" variant="ghost" size="sm">
              Go to Mine Dine
            </Button>
          </p>
        </div>
      </Container>
    </div>
  )
}
