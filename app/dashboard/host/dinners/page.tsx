'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dinners</h1>
            <p className="mt-2 text-gray-600">Manage your dinner listings</p>
          </div>
          <Button onClick={() => router.push('/dashboard/host/dinners/new')}>
            Create New Dinner
          </Button>
        </div>

        {dinners.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">You haven't created any dinners yet.</p>
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
                      dinner.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      dinner.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {dinner.status}
                    </span>
                  </div>
                  <CardDescription>
                    {format(new Date(dinner.dateTime), 'PPP p')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📍 {dinner.location}</p>
                    <p>👥 {dinner._count.bookings} / {dinner.maxGuests} guests</p>
                    <p>💰 €{dinner.basePricePerPerson} per person</p>
                  </div>
                  <div className="mt-4 flex gap-2">
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
