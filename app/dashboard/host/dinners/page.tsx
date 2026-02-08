'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { format } from 'date-fns'

interface Dinner {
  id: string
  title: string
  description: string
  dateTime: string
  status: string
  maxGuests: number
  basePricePerPerson: number
  location: string
  _count: {
    bookings: number
  }
}

export default function HostDinnersPage() {
  const router = useRouter()
  const [dinners, setDinners] = useState<Dinner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dinners?status=all')
      .then((res) => res.json())
      .then((data) => {
        // Filter to only show current user's dinners
        // In production, this should be done server-side
        setDinners(data.dinners || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching dinners:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <LoadingScreen title="Loading your dinners" subtitle="Fetching your listings" />
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">My Dinners</h1>
            <p className="mt-2 text-[var(--foreground-secondary)]">Manage your dinner listings</p>
          </div>
          <Button onClick={() => router.push('/dashboard/host/dinners/new')}>
            Create New Dinner
          </Button>
        </div>

        {dinners.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-[var(--foreground-muted)] mb-4">You haven't created any dinners yet.</p>
              <Button onClick={() => router.push('/dashboard/host/dinners/new')}>
                Create Your First Dinner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dinners.map((dinner) => (
              <Card key={dinner.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{dinner.title}</CardTitle>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      dinner.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      dinner.status === 'DRAFT' ? 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)]' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {dinner.status}
                    </span>
                  </div>
                  <CardDescription>
                    {format(new Date(dinner.dateTime), 'PPP p')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-[var(--foreground-muted)]">
                    <p>📍 {dinner.location}</p>
                    <p>👥 {dinner._count.bookings} / {dinner.maxGuests} guests</p>
                    <p>💰 €{dinner.basePricePerPerson} per person</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/host/dinners/${dinner.id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/host/dinners/${dinner.id}/invite`)}
                    >
                      Invite
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dinners/${dinner.id}`)}
                    >
                      View
                    </Button>
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
