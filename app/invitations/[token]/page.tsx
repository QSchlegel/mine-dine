'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, MapPin, User, Check, X } from 'lucide-react'
import { Container, Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'

interface DinnerSummary {
  id: string
  title: string
  description: string
  dateTime: string
  location: string
  cuisine: string | null
  maxGuests: number
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
        <div className="animate-pulse text-[var(--foreground-secondary)]">Loading invitation…</div>
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
  const dinnerDate = format(new Date(dinner.dateTime), 'EEEE, MMMM d, yyyy \'at\' HH:mm')
  const alreadyResponded = inv.status !== 'PENDING' || responded

  return (
    <div className="min-h-screen bg-[var(--background)] py-12">
      <Container>
        <div className="max-w-xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">You&apos;re invited</CardTitle>
              <p className="text-[var(--foreground-secondary)] text-sm mt-1">
                {hostName} invited you to a dinner
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
                <div className="pt-2">
                  <p className="text-[var(--foreground-secondary)]">
                    You {responded === 'ACCEPTED' || inv.status === 'ACCEPTED' ? 'accepted' : 'declined'} this invitation.
                  </p>
                  <Button
                    href={`/dinners/${dinner.id}`}
                    variant="secondary"
                    className="mt-3"
                  >
                    View dinner
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={() => handleRespond('ACCEPTED')}
                    disabled={responding}
                    leftIcon={<Check className="h-4 w-4" />}
                  >
                    {responding ? 'Sending…' : 'Accept'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRespond('DECLINED')}
                    disabled={responding}
                    leftIcon={<X className="h-4 w-4" />}
                  >
                    Decline
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
