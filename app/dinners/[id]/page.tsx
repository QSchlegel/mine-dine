'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import Image from 'next/image'

interface Dinner {
  id: string
  title: string
  description: string
  dateTime: string
  location: string
  basePricePerPerson: number
  maxGuests: number
  imageUrl?: string | null
  host: {
    id: string
    name: string | null
    bio: string | null
    profileImageUrl: string | null
  }
  addOns: Array<{
    id: string
    name: string
    description: string | null
    price: number
  }>
  groceryBills: Array<{
    id: string
    imageUrl: string
    totalAmount: number | null
  }>
  _count: {
    bookings: number
  }
}

export default function DinnerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [dinner, setDinner] = useState<Dinner | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/dinners/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setDinner(data.dinner)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error fetching dinner:', err)
          setLoading(false)
        })
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!dinner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dinner not found</h1>
          <Button onClick={() => router.push('/dinners')}>
            Browse Dinners
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {dinner.imageUrl && (
          <div className="relative h-96 w-full mb-8 rounded-lg overflow-hidden">
            <Image
              src={dinner.imageUrl}
              alt={dinner.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{dinner.title}</CardTitle>
                <CardDescription>
                  {format(new Date(dinner.dateTime), 'PPP p')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{dinner.description}</p>
              </CardContent>
            </Card>

            {dinner.addOns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Add-ons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dinner.addOns.map((addOn) => (
                      <div key={addOn.id} className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{addOn.name}</p>
                          {addOn.description && (
                            <p className="text-sm text-gray-600">{addOn.description}</p>
                          )}
                        </div>
                        <p className="font-semibold">€{addOn.price}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {dinner.groceryBills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Grocery Bills (Transparency)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dinner.groceryBills.map((bill) => (
                      <div key={bill.id}>
                        {bill.imageUrl && (
                          <div className="relative h-48 w-full mb-2 rounded overflow-hidden">
                            <Image
                              src={bill.imageUrl}
                              alt="Grocery bill"
                              fill
                              className="object-contain bg-gray-100"
                            />
                          </div>
                        )}
                        {bill.totalAmount && (
                          <p className="text-sm text-gray-600">
                            Total: €{bill.totalAmount}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{dinner.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    €{dinner.basePricePerPerson} per person
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Availability</p>
                  <p className="font-medium">
                    {dinner._count.bookings} / {dinner.maxGuests} guests
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => router.push(`/dinners/${dinner.id}/book`)}
                  disabled={dinner._count.bookings >= dinner.maxGuests}
                >
                  {dinner._count.bookings >= dinner.maxGuests ? 'Fully Booked' : 'Book Now'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Host</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  {dinner.host.profileImageUrl && (
                    <div className="relative h-16 w-16 rounded-full overflow-hidden">
                      <Image
                        src={dinner.host.profileImageUrl}
                        alt={dinner.host.name || 'Host'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{dinner.host.name || 'Anonymous'}</p>
                    {dinner.host.bio && (
                      <p className="text-sm text-gray-600 mt-1">{dinner.host.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
