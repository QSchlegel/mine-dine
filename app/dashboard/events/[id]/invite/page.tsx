'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Mail,
  Send,
  RefreshCw,
  Copy,
  Check,
  Clock,
  X,
  Link as LinkIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface Invitation {
  id: string
  email: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  token: string
  createdAt: string
}

interface Event {
  id: string
  title: string
  dateTime: string
  location: string
}

export default function EventInvitePage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [sending, setSending] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const fetchEvent = async () => {
    if (!eventId) return
    const res = await fetch(`/api/dinners/${eventId}`, { cache: 'no-store' })
    const data = await res.json()
    if (res.ok) setEvent(data.dinner)
  }

  const fetchInvitations = async () => {
    if (!eventId) return
    const res = await fetch(`/api/dinners/${eventId}/invitations`, { cache: 'no-store' })
    const data = await res.json()
    if (res.ok) setInvitations(data.invitations ?? [])
    else setError(data.error ?? 'Failed to load invitations')
  }

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }
    Promise.all([fetchEvent(), fetchInvitations()]).finally(() => setLoading(false))
  }, [eventId])

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault()
    const emails = emailInput
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))

    if (emails.length === 0) {
      setError('Enter at least one valid email address')
      return
    }

    setError(null)
    setSending(true)

    try {
      const res = await fetch(`/api/dinners/${eventId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emails.length === 1 ? { email: emails[0] } : { emails }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send invitations')
      setEmailInput('')
      await fetchInvitations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const handleResend = async (invitationId: string) => {
    setResendingId(invitationId)
    setError(null)

    try {
      const res = await fetch(`/api/dinners/${eventId}/invitations/${invitationId}/resend`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to resend')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend')
    } finally {
      setResendingId(null)
    }
  }

  const copyEventLink = async () => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/dinners/${eventId}`
    await navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading) {
    return <LoadingScreen title="Loading" subtitle="Fetching invitation details" />
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-[var(--foreground-secondary)] mb-4">Event not found</p>
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

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/dashboard/events/${eventId}`}
            className="inline-flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to event
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Invite Guests</h1>
          <p className="text-[var(--foreground-secondary)] mt-1">
            {event.title} - {format(new Date(event.dateTime), 'EEEE, MMM d \'at\' h:mm a')}
          </p>
        </div>

        {/* RSVP Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
              <Check className="h-4 w-4" />
              <span className="text-2xl font-bold">{accepted.length}</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">Coming</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-2xl font-bold">{pending.length}</span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">Pending</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
              <X className="h-4 w-4" />
              <span className="text-2xl font-bold">{declined.length}</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">Can't make it</p>
          </div>
        </div>

        {/* Invite by Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invite by Email
            </CardTitle>
            <CardDescription>
              Add email addresses (comma or space separated). They'll receive a link to RSVP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendInvites} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="friend@example.com, another@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending} leftIcon={<Send className="h-4 w-4" />}>
                  {sending ? 'Sending...' : 'Send Invites'}
                </Button>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>
          </CardContent>
        </Card>

        {/* Share Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Share Link
            </CardTitle>
            <CardDescription>Copy the event link to share manually</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/dinners/${eventId}`}
                className="flex-1 bg-[var(--background-secondary)]"
              />
              <Button
                variant="outline"
                onClick={copyEventLink}
                leftIcon={copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copiedLink ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guest List */}
        <Card>
          <CardHeader>
            <CardTitle>Guest List</CardTitle>
            <CardDescription>
              {invitations.length === 0
                ? 'No one invited yet'
                : `${invitations.length} guest${invitations.length === 1 ? '' : 's'} invited`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <p className="text-[var(--foreground-muted)] text-sm py-4 text-center">
                Use the form above to invite people by email.
              </p>
            ) : (
              <ul className="space-y-3">
                {invitations.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-[var(--border)] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                          inv.status === 'ACCEPTED'
                            ? 'bg-green-500'
                            : inv.status === 'DECLINED'
                            ? 'bg-red-500'
                            : 'bg-amber-500'
                        }`}
                      >
                        {inv.status === 'ACCEPTED' && <Check className="h-4 w-4" />}
                        {inv.status === 'DECLINED' && <X className="h-4 w-4" />}
                        {inv.status === 'PENDING' && <Clock className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{inv.email}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          Invited {format(new Date(inv.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          inv.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : inv.status === 'DECLINED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}
                      >
                        {inv.status === 'ACCEPTED'
                          ? 'Coming'
                          : inv.status === 'DECLINED'
                          ? "Can't make it"
                          : 'Pending'}
                      </span>
                      {inv.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(inv.id)}
                          disabled={resendingId === inv.id}
                          leftIcon={
                            <RefreshCw
                              className={`h-3.5 w-3.5 ${resendingId === inv.id ? 'animate-spin' : ''}`}
                            />
                          }
                        >
                          Resend
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push(`/dashboard/events/${eventId}`)}>
            Back to Event
          </Button>
        </div>
      </div>
    </div>
  )
}
