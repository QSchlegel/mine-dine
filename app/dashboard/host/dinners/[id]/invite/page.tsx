'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Mail, Send, RefreshCw } from 'lucide-react'
import {
  Container,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
} from '@/components/ui'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface Invitation {
  id: string
  email: string
  status: string
  token: string
  createdAt: string
  user?: { id: string; name: string | null; email: string | null }
}

interface Dinner {
  id: string
  title: string
  dateTime: string
}

export default function HostInvitePage() {
  const params = useParams()
  const router = useRouter()
  const dinnerId = params?.id as string
  const [dinner, setDinner] = useState<Dinner | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [sending, setSending] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)

  const fetchDinner = async () => {
    if (!dinnerId) return
    const res = await fetch(`/api/dinners/${dinnerId}`)
    const data = await res.json()
    if (res.ok) setDinner(data.dinner)
  }

  const fetchInvitations = async () => {
    if (!dinnerId) return
    const res = await fetch(`/api/dinners/${dinnerId}/invitations`)
    const data = await res.json()
    if (res.ok) setInvitations(data.invitations ?? [])
    else setError(data.error ?? 'Failed to load invitations')
  }

  useEffect(() => {
    if (!dinnerId) {
      setLoading(false)
      return
    }
    Promise.all([fetchDinner(), fetchInvitations()]).finally(() => setLoading(false))
  }, [dinnerId])

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault()
    const emails = emailInput
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    if (emails.length === 0) {
      setError('Enter at least one valid email address')
      return
    }
    setError(null)
    setSending(true)
    try {
      const res = await fetch(`/api/dinners/${dinnerId}/invitations`, {
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
      const res = await fetch(`/api/dinners/${dinnerId}/invitations/${invitationId}/resend`, {
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

  if (loading) {
    return <LoadingScreen title="Loading" subtitle="Fetching invitations" />
  }

  if (!dinner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dinner not found</h1>
          <Button onClick={() => router.push('/dashboard/host/dinners')}>Back to Dinners</Button>
        </div>
      </div>
    )
  }

  const statusLabel: Record<string, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    DECLINED: 'Declined',
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <Container>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Invite guests</h1>
            <p className="text-[var(--foreground-secondary)] mt-1">
              {dinner.title} – {format(new Date(dinner.dateTime), 'PPP')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invite by email
              </CardTitle>
              <CardDescription>
                Add one or more email addresses (comma or space separated). They’ll receive a link to view the event and accept or decline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvites} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="friend@example.com, another@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending} leftIcon={<Send className="h-4 w-4" />}>
                  {sending ? 'Sending…' : 'Send invites'}
                </Button>
              </form>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invitees</CardTitle>
              <CardDescription>
                {invitations.length === 0
                  ? 'No one invited yet.'
                  : `${invitations.length} invitee${invitations.length === 1 ? '' : 's'}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <p className="text-[var(--foreground-secondary)] text-sm">Use the form above to invite people by email.</p>
              ) : (
                <ul className="space-y-3">
                  {invitations.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-[var(--border)] last:border-0"
                    >
                      <div>
                        <span className="font-medium text-[var(--foreground)]">{inv.email}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          inv.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          inv.status === 'DECLINED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          'bg-[var(--background-secondary)] text-[var(--foreground-secondary)]'
                        }`}>
                          {statusLabel[inv.status] ?? inv.status}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResend(inv.id)}
                        disabled={resendingId === inv.id}
                        leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${resendingId === inv.id ? 'animate-spin' : ''}`} />}
                      >
                        Resend
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/host/dinners/${dinnerId}/edit`)}>
              Edit dinner
            </Button>
            <Button variant="outline" onClick={() => router.push(`/dashboard/host/dinners/${dinnerId}/guests`)}>
              Guests
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}
