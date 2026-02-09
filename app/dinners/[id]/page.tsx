'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import Image from 'next/image'
import { MapPin, Users, Calendar, Clock, ChefHat, Share2 } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/image-proxy'

import {
  Container,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  PriceDisplay,
  Countdown,
  CountdownBadge,
  ProgressBar,
  AvatarWithStatus,
  Divider,
  Section,
  Badge,
  EmptyState,
  DinnerCardSkeleton,
} from '@/components/ui'

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
  const searchParams = useSearchParams()
  const [dinner, setDinner] = useState<Dinner | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  const getShareUrl = () => {
    if (typeof window === 'undefined') return ''
    const invite = searchParams.get('invite')
    const path = invite
      ? `/dinners/${params.id}?invite=${encodeURIComponent(invite)}`
      : `/dinners/${params.id}`
    return `${window.location.origin}${path}`
  }

  const handleShare = async () => {
    if (!dinner) return
    const url = getShareUrl()
    const title = dinner.title
    const text = `Join me for ${dinner.title} on Mine Dine`
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text, url })
        setShareCopied(true)
      } else {
        await navigator.clipboard.writeText(url)
        setShareCopied(true)
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        await navigator.clipboard?.writeText(url).catch(() => {})
        setShareCopied(true)
      }
    }
    setTimeout(() => setShareCopied(false), 2000)
  }

  useEffect(() => {
    if (params.id) {
      setErrorMessage(null)
      const invite = searchParams.get('invite')
      const url = invite
        ? `/api/dinners/${params.id}?invite=${encodeURIComponent(invite)}`
        : `/api/dinners/${params.id}`
      fetch(url)
        .then(async (res) => {
          const data = await res.json()
          if (!res.ok) {
            setErrorMessage(data.error ?? 'Failed to load dinner')
            setDinner(null)
            setLoading(false)
            return
          }
          setDinner(data.dinner)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error fetching dinner:', err)
          setErrorMessage('Failed to load dinner')
          setLoading(false)
        })
    }
  }, [params.id, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-12">
        <Container>
          <div className="animate-pulse">
            <div className="h-96 bg-[var(--background-secondary)] rounded-xl mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <DinnerCardSkeleton />
              </div>
              <div className="space-y-6">
                <DinnerCardSkeleton />
              </div>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  if (!dinner) {
    const isNotFound = errorMessage === 'Dinner not found'
    const description = isNotFound
      ? 'This dinner may not be published yet, or it may have been removed. If you\'re the host, log in to preview your draft.'
      : errorMessage ?? 'This dinner may have been removed or doesn\'t exist.'
    return (
      <div className="min-h-screen bg-[var(--background)] py-12">
        <Container>
          <EmptyState
            title={errorMessage === 'This event is private' ? 'Private event' : 'Dinner not found'}
            description={description}
            icon={<ChefHat />}
            size="lg"
            action={{
              label: 'Browse Dinners',
              onClick: () => router.push('/dinners'),
            }}
          />
        </Container>
      </div>
    )
  }

  const dinnerDate = new Date(dinner.dateTime)
  const isPast = dinnerDate < new Date()
  const isFull = dinner._count.bookings >= dinner.maxGuests
  const spotsLeft = dinner.maxGuests - dinner._count.bookings
  const fillPercentage = (dinner._count.bookings / dinner.maxGuests) * 100

  return (
    <div className="min-h-screen bg-[var(--background)] py-12">
      <Container>
        {/* Hero Image */}
        {dinner.imageUrl && (
          <div className="relative h-[400px] w-full mb-8 rounded-2xl overflow-hidden">
            <Image
              src={getProxiedImageUrl(dinner.imageUrl) ?? dinner.imageUrl}
              alt={dinner.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Countdown Badge & Share */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
                leftIcon={<Share2 className="h-4 w-4" />}
                className="!bg-white/90 hover:!bg-white !text-gray-800 backdrop-blur-sm"
              >
                {shareCopied ? 'Copied!' : 'Share'}
              </Button>
              {!isPast && <CountdownBadge targetDate={dinnerDate} />}
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {dinner.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(dinnerDate, 'EEEE, MMM d')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {format(dinnerDate, 'h:mm a')}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {dinner.location}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About this Dinner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--foreground-secondary)] whitespace-pre-wrap leading-relaxed">
                  {dinner.description}
                </p>
              </CardContent>
            </Card>

            {/* Countdown Section (if upcoming) */}
            {!isPast && (
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-coral-500/10 to-accent-500/10 dark:from-coral-500/20 dark:to-accent-500/20 p-6">
                  <h3 className="text-center text-sm font-medium text-[var(--foreground-secondary)] mb-4">
                    Dinner starts in
                  </h3>
                  <Countdown
                    targetDate={dinnerDate}
                    size="lg"
                    completedLabel="Dinner is happening now!"
                  />
                </div>
              </Card>
            )}

            {/* Add-ons */}
            {dinner.addOns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Add-ons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dinner.addOns.map((addOn, index) => (
                      <div key={addOn.id}>
                        {index > 0 && <Divider spacing="sm" />}
                        <div className="flex justify-between items-start py-2">
                          <div className="flex-1">
                            <p className="font-medium text-[var(--foreground)]">{addOn.name}</p>
                            {addOn.description && (
                              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                                {addOn.description}
                              </p>
                            )}
                          </div>
                          <PriceDisplay
                            amount={addOn.price}
                            size="sm"
                            className="ml-4"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grocery Bills (Transparency) */}
            {dinner.groceryBills.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Cost Transparency</CardTitle>
                    <Badge variant="success" size="sm">Verified</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--foreground-secondary)] mb-4">
                    See exactly what goes into preparing this meal
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {dinner.groceryBills.map((bill) => (
                      <div
                        key={bill.id}
                        className="rounded-lg border border-[var(--border)] overflow-hidden"
                      >
                        {bill.imageUrl && (
                          <div className="relative h-40 w-full bg-[var(--background-secondary)]">
                            <Image
                              src={getProxiedImageUrl(bill.imageUrl) ?? bill.imageUrl}
                              alt="Grocery bill"
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        {bill.totalAmount && (
                          <div className="p-3 bg-[var(--background-secondary)]">
                            <PriceDisplay amount={bill.totalAmount} size="sm" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Book Your Spot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Price */}
                <div>
                  <p className="text-sm text-[var(--foreground-muted)] mb-1">Price</p>
                  <PriceDisplay
                    amount={dinner.basePricePerPerson}
                    size="lg"
                    perPerson
                  />
                </div>

                <Divider spacing="sm" />

                {/* Date & Time */}
                <div>
                  <p className="text-sm text-[var(--foreground-muted)] mb-1">When</p>
                  <p className="font-medium text-[var(--foreground)]">
                    {format(dinnerDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    at {format(dinnerDate, 'h:mm a')}
                  </p>
                </div>

                <Divider spacing="sm" />

                {/* Availability */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-[var(--foreground-muted)]">Availability</p>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-[var(--foreground-muted)]" />
                      <span className="font-medium text-[var(--foreground)]">
                        {dinner._count.bookings}
                      </span>
                      <span className="text-[var(--foreground-muted)]">
                        / {dinner.maxGuests}
                      </span>
                    </div>
                  </div>
                  <ProgressBar
                    value={fillPercentage}
                    variant={isFull ? 'danger' : fillPercentage > 75 ? 'warning' : 'success'}
                    size="md"
                  />
                  {!isFull && (
                    <p className="text-xs text-[var(--foreground-muted)] mt-1.5">
                      {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => router.push(`/dinners/${dinner.id}/book`)}
                  disabled={isFull || isPast}
                >
                  {isPast ? 'Event Ended' : isFull ? 'Fully Booked' : 'Book Now'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={handleShare}
                  leftIcon={<Share2 className="h-4 w-4" />}
                >
                  {shareCopied ? 'Link copied!' : 'Share this dinner'}
                </Button>
              </CardContent>
            </Card>

            {/* Host Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Host</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <AvatarWithStatus
                    src={dinner.host.profileImageUrl || undefined}
                    name={dinner.host.name || 'Host'}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--foreground)]">
                      {dinner.host.name || 'Anonymous Host'}
                    </p>
                    {dinner.host.bio && (
                      <p className="text-sm text-[var(--foreground-secondary)] mt-1 line-clamp-3">
                        {dinner.host.bio}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  )
}
