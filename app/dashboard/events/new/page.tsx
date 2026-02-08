'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  Loader2,
  PartyPopper,
  DollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [maxGuests, setMaxGuests] = useState(10)
  const [imageUrl, setImageUrl] = useState('')
  const [enableCostSplit, setEnableCostSplit] = useState(false)
  const [pricePerPerson, setPricePerPerson] = useState(0)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (title.length < 3) newErrors.title = 'Title must be at least 3 characters'
    if (description.length < 10) newErrors.description = 'Description must be at least 10 characters'
    if (location.length < 5) newErrors.location = 'Location must be at least 5 characters'
    if (!dateTime) newErrors.dateTime = 'Date and time is required'
    else if (new Date(dateTime) <= new Date()) newErrors.dateTime = 'Date must be in the future'
    if (maxGuests < 1 || maxGuests > 100) newErrors.maxGuests = 'Max guests must be between 1 and 100'
    if (enableCostSplit && pricePerPerson < 0) newErrors.pricePerPerson = 'Price cannot be negative'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          dateTime: new Date(dateTime).toISOString(),
          maxGuests,
          imageUrl: imageUrl || null,
          enableCostSplit,
          basePricePerPerson: enableCostSplit ? pricePerPerson : 0,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create event')
      }

      const { event } = await res.json()
      // Redirect to invite page to add guests
      router.push(`/dashboard/events/${event.id}/invite`)
    } catch (error) {
      console.error('Error creating event:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create event' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to events
          </Link>
          <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
            <PartyPopper className="w-8 h-8 text-coral-500" />
            Create Private Event
          </h1>
          <p className="text-[var(--foreground-secondary)] mt-1">
            Invite friends and family to your gathering
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Event Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Birthday Dinner, Family Gathering, Game Night"
                  error={errors.title}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Description *
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's the occasion? Any special details guests should know?"
                  rows={3}
                  error={errors.description}
                />
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  {description.length}/2000 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Date & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-coral-500" />
                When & Where
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Date & Time *
                </label>
                <Input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  error={errors.dateTime}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Location *
                </label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[var(--foreground-muted)] flex-shrink-0" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., My place, 123 Main St, or a restaurant name"
                    error={errors.location}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Max Guests
                </label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--foreground-muted)]" />
                  <Input
                    type="number"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(parseInt(e.target.value) || 1)}
                    min={1}
                    max={100}
                    error={errors.maxGuests}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Split (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-coral-500" />
                Cost Split (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableCostSplit"
                  checked={enableCostSplit}
                  onChange={(e) => setEnableCostSplit(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border)] text-coral-500 focus:ring-coral-500"
                />
                <label htmlFor="enableCostSplit" className="text-sm text-[var(--foreground)]">
                  Split costs among guests
                </label>
              </div>

              {enableCostSplit && (
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Cost per Person
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--foreground-muted)]">$</span>
                    <Input
                      type="number"
                      value={pricePerPerson}
                      onChange={(e) => setPricePerPerson(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.5}
                      error={errors.pricePerPerson}
                    />
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">
                    This helps guests know about any shared costs (food, drinks, etc.)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-coral-500" />
                Cover Image (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  error={errors.imageUrl}
                />
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Add a photo to make your event more inviting
                </p>
              </div>

              {imageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-[var(--foreground)] mb-2">Preview</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error display */}
          {errors.submit && (
            <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300">{errors.submit}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/events')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create & Invite Guests
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
