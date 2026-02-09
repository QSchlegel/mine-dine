'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useSession } from '@/lib/auth-client'

type InviteScope = 'GUEST_VIEW' | 'COHOST_REQUEST'

type Dinner = {
  id: string
  title: string
  description: string
  cuisine?: string | null
  location: string
  dateTime: string
  imageUrl?: string | null
  host: { id: string; name: string | null; profileImageUrl: string | null }
}

export default function DinnerInvitePage() {
  const params = useParams()
  const token = params?.token as string
  const { data: session } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dinner, setDinner] = useState<Dinner | null>(null)
  const [scope, setScope] = useState<InviteScope>('GUEST_VIEW')
  const [authRequired, setAuthRequired] = useState(false)
  const [cohostRequestStatus, setCohostRequestStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/dinners/invite/${token}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          if (res.status === 401 && data?.scope === 'COHOST_REQUEST' && data?.dinner) {
            setScope('COHOST_REQUEST')
            setDinner(data.dinner)
            setAuthRequired(true)
            setCohostRequestStatus(null)
            return
          }
          throw new Error(data?.error ?? 'Invite link invalid')
        }

        setScope((data?.scope as InviteScope) ?? 'GUEST_VIEW')
        setDinner(data?.dinner ?? null)
        setAuthRequired(false)
        setCohostRequestStatus(data?.request?.status ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load invite')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [token, session?.user?.id])

  if (loading) {
    return <LoadingScreen title="Loading" subtitle="Opening invite" />
  }

  if (error || !dinner) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-[var(--foreground-secondary)] mb-4">{error ?? 'Invite not found'}</p>
            <Button href="/dinners" variant="secondary">Browse Dinners</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const redirectPath = `/dinners/invite/${token}`
  const loginHref = `/login?redirect=${encodeURIComponent(redirectPath)}`
  const signupHref = `/signup?redirect=${encodeURIComponent(redirectPath)}`
  const quickSignupHref = `/signup?quick=magic&redirect=${encodeURIComponent(redirectPath)}`

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">{dinner.title}</h1>
          <p className="text-[var(--foreground-secondary)] mt-2">
            {format(new Date(dinner.dateTime), "EEEE, MMM d 'at' h:mm a")} · {dinner.location}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{scope === 'COHOST_REQUEST' ? 'Co-host invitation' : 'Private event'}</CardTitle>
            <CardDescription>
              {scope === 'COHOST_REQUEST'
                ? 'This link can request co-host access for this event.'
                : 'You have access via an invite link. This link is view-only.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dinner.description ? (
              <p className="text-[var(--foreground)] whitespace-pre-wrap">{dinner.description}</p>
            ) : (
              <p className="text-[var(--foreground-secondary)]">No description yet.</p>
            )}

            {scope === 'COHOST_REQUEST' ? (
              <div className="space-y-3">
                {authRequired || !session?.user ? (
                  <>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      Log in or sign up first to request co-host access.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button href={loginHref} variant="secondary">Log in</Button>
                      <Button href={quickSignupHref}>Quick Sign Up</Button>
                      <Button href={signupHref} variant="outline">More Sign Up Options</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {cohostRequestStatus === 'APPROVED'
                          ? 'You are approved as co-host.'
                          : cohostRequestStatus === 'PENDING'
                          ? 'Your co-host request is pending approval.'
                          : 'Your co-host request has been submitted.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button href={`/dinners/${dinner.id}`} variant="secondary">View Event</Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button href="/dinners" variant="secondary">Browse Dinners</Button>
                <Link href={loginHref} className="inline-flex">
                  <Button variant="outline">Log in</Button>
                </Link>
                <Link href={quickSignupHref} className="inline-flex">
                  <Button>Quick Sign Up</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
