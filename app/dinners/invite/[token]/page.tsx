'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dinner, setDinner] = useState<Dinner | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    const run = async () => {
      try {
        const res = await fetch(`/api/dinners/invite/${token}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? 'Invite link invalid')
        setDinner(data.dinner)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load invite')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [token])

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
            <CardTitle>Private event</CardTitle>
            <CardDescription>
              You have access via an invite link. This link is view-only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dinner.description ? (
              <p className="text-[var(--foreground)] whitespace-pre-wrap">{dinner.description}</p>
            ) : (
              <p className="text-[var(--foreground-secondary)]">No description yet.</p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button href="/dinners" variant="secondary">Browse Dinners</Button>
              <Link href="/login" className="inline-flex">
                <Button variant="outline">Log in</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
