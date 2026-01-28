'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import HelpButton from '@/components/guides/HelpButton'
import { useTheme } from '@/components/ThemeProvider'

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

// Payment form component that uses Stripe Elements
function PaymentForm({ 
  clientSecret, 
  bookingId, 
  onBack 
}: { 
  clientSecret: string
  bookingId: string
  onBack: () => void 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setErrorMessage(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/bookings/${bookingId}/confirmation`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(error.message || 'Payment failed')
        setProcessing(false)
      } else {
        // Payment succeeded, redirect to confirmation
        router.push(`/dashboard/bookings/${bookingId}/confirmation`)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Payment failed')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handlePaymentSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={processing}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          isLoading={processing}
          disabled={!stripe || !elements || processing}
          className="flex-1"
        >
          Pay Now
        </Button>
      </div>
    </form>
  )
}

export default function BookDinnerPage() {
  const params = useParams()
  const router = useRouter()
  const [dinner, setDinner] = useState<Dinner | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [numberOfGuests, setNumberOfGuests] = useState(1)
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({})
  const [step, setStep] = useState<'booking' | 'payment'>('booking')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

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

  const handleBookingSubmit = async (e: React.FormEvent) => {
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

      // Store booking data and move to payment step
      setClientSecret(data.clientSecret)
      setBookingId(data.booking.id)
      setStep('payment')
    } catch (err) {
      console.error('Booking error:', err)
      alert(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingScreen title="Preparing checkout" subtitle="Setting up your reservation" />
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
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <HelpButton pageId="booking" />
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Book: {dinner.title}</CardTitle>
            <CardDescription>
              {step === 'booking' 
                ? 'Complete your booking below'
                : 'Complete your payment to confirm your booking'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'booking' ? (
              <form onSubmit={handleBookingSubmit} className="space-y-6">
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
                  <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                    Add-ons
                  </label>
                  <div className="space-y-3">
                    {dinner.addOns.map((addOn) => (
                      <div key={addOn.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{addOn.name}</p>
                          {addOn.description && (
                            <p className="text-sm text-[var(--foreground-muted)]">{addOn.description}</p>
                          )}
                          <p className="text-sm font-semibold text-[var(--primary)]">€{addOn.price}</p>
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
            ) : clientSecret ? (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: resolvedTheme === 'dark' ? 'night' : 'stripe',
                    variables: {
                      colorPrimary: 'var(--primary)',
                      colorBackground: 'var(--background)',
                      colorText: 'var(--foreground)',
                      colorDanger: 'var(--danger-500)',
                      fontFamily: 'system-ui, sans-serif',
                      spacingUnit: '4px',
                      borderRadius: '12px',
                    },
                  },
                }}
              >
                <PaymentForm 
                  clientSecret={clientSecret}
                  bookingId={bookingId!}
                  onBack={() => setStep('booking')}
                />
              </Elements>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
