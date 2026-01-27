'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import HelpButton from '@/components/guides/HelpButton'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Dinner {
  id: string
  title: string
  basePricePerPerson: number
  maxGuests: number
  addOns: Array<{
    id: string
    name: string
    description: string | null
    price: number
  }>
  _count: {
    bookings: number
  }
}

export default function BookDinnerPage() {
  const params = useParams()
  const router = useRouter()
  const [dinner, setDinner] = useState<Dinner | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [numberOfGuests, setNumberOfGuests] = useState(1)
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({})

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

  const handleAddOnChange = (addOnId: string, quantity: number) => {
    if (quantity === 0) {
      const newSelected = { ...selectedAddOns }
      delete newSelected[addOnId]
      setSelectedAddOns(newSelected)
    } else {
      setSelectedAddOns({
        ...selectedAddOns,
        [addOnId]: quantity,
      })
    }
  }

  const calculateTotal = () => {
    if (!dinner) return 0
    const basePrice = dinner.basePricePerPerson * numberOfGuests
    const addOnsTotal = dinner.addOns.reduce((sum, addOn) => {
      const quantity = selectedAddOns[addOn.id] || 0
      return sum + addOn.price * quantity
    }, 0)
    return basePrice + addOnsTotal
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const selectedAddOnsArray = Object.entries(selectedAddOns).map(([addOnId, quantity]) => ({
        addOnId,
        quantity,
      }))

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dinnerId: dinner!.id,
          numberOfGuests,
          selectedAddOns: selectedAddOnsArray,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error } = await stripe.confirmCardPayment(data.clientSecret, {
        // payment_method will be handled by Stripe Elements in production
      })

      if (error) {
        throw new Error(error.message)
      }

      router.push(`/dashboard/bookings/${data.booking.id}/confirmation`)
    } catch (err) {
      console.error('Booking error:', err)
      alert(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

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

  const total = calculateTotal()
  const basePrice = dinner.basePricePerPerson * numberOfGuests

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <HelpButton pageId="booking" />
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Book: {dinner.title}</CardTitle>
            <CardDescription>
              Complete your booking below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="number"
                label="Number of Guests"
                min={1}
                max={dinner.maxGuests - dinner._count.bookings}
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
                required
              />

              {dinner.addOns.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add-ons
                  </label>
                  <div className="space-y-3">
                    {dinner.addOns.map((addOn) => (
                      <div key={addOn.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{addOn.name}</p>
                          {addOn.description && (
                            <p className="text-sm text-gray-600">{addOn.description}</p>
                          )}
                          <p className="text-sm font-semibold text-indigo-600">€{addOn.price}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleAddOnChange(addOn.id, (selectedAddOns[addOn.id] || 0) - 1)}
                            className="w-8 h-8 rounded-full border flex items-center justify-center"
                            disabled={(selectedAddOns[addOn.id] || 0) === 0}
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{selectedAddOns[addOn.id] || 0}</span>
                          <button
                            type="button"
                            onClick={() => handleAddOnChange(addOn.id, (selectedAddOns[addOn.id] || 0) + 1)}
                            className="w-8 h-8 rounded-full border flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base price ({numberOfGuests} guests × €{dinner.basePricePerPerson})</span>
                  <span>€{basePrice.toFixed(2)}</span>
                </div>
                {Object.keys(selectedAddOns).length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Add-ons</span>
                    <span>€{(total - basePrice).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={submitting}
                className="w-full"
                disabled={numberOfGuests < 1 || numberOfGuests > (dinner.maxGuests - dinner._count.bookings)}
              >
                Proceed to Payment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
