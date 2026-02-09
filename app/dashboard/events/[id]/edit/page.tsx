'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Save,
  Upload,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { getProxiedImageUrl } from '@/lib/image-proxy'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

interface EventData {
  id: string
  title: string
  description: string
  dateTime: string
  location: string
  maxGuests: number
  basePricePerPerson: number
  imageUrl: string | null
  status: string
}

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [maxGuests, setMaxGuests] = useState(10)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [enableCostSplit, setEnableCostSplit] = useState(false)
  const [pricePerPerson, setPricePerPerson] = useState(0)

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`, { cache: 'no-store' })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error ?? 'Failed to load event')
        }

        const event = data.event as EventData
        setTitle(event.title)
        setDescription(event.description)
        setLocation(event.location)
        setDateTime(new Date(event.dateTime).toISOString().slice(0, 16))
        setMaxGuests(event.maxGuests)
        setImageUrl(event.imageUrl ?? '')
        setEnableCostSplit(event.basePricePerPerson > 0)
        setPricePerPerson(event.basePricePerPerson)
      } catch (error) {
        setErrors({ fetch: error instanceof Error ? error.message : 'Failed to load event' })
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  const validateForm = () => {
    const nextErrors: Record<string, string> = {}

    if (title.trim().length < 3) nextErrors.title = 'Title must be at least 3 characters'
    if (description.trim().length < 10) nextErrors.description = 'Description must be at least 10 characters'
    if (location.trim().length < 5) nextErrors.location = 'Location must be at least 5 characters'
    if (!dateTime) nextErrors.dateTime = 'Date and time is required'
    if (maxGuests < 1 || maxGuests > 100) nextErrors.maxGuests = 'Max guests must be between 1 and 100'
    if (enableCostSplit && pricePerPerson < 0) nextErrors.pricePerPerson = 'Price cannot be negative'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const uploadFile = async (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only JPG, PNG, WEBP, or GIF are allowed.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('File is too large. Maximum size is 10MB.')
      return
    }

    setUploadingImage(true)
    setImageError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'dinner')

      const res = await fetch('/api/uploads', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Upload failed')
      }

      setImageUrl(data.signedUrl || data.url)
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => setDragActive(false)

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    setErrors((prev) => {
      const { submit, ...rest } = prev
      return rest
    })

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          dateTime: new Date(dateTime).toISOString(),
          maxGuests,
          imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
          enableCostSplit,
          basePricePerPerson: enableCostSplit ? pricePerPerson : 0,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to update event')
      }

      router.push(`/dashboard/events/${eventId}`)
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to update event' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingScreen title="Loading event" subtitle="Preparing event editor" />
  }

  if (errors.fetch) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-[var(--foreground-secondary)] mb-4">{errors.fetch}</p>
            <Button href="/dashboard/events" variant="secondary">
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link
            href={`/dashboard/events/${eventId}`}
            className="inline-flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to event
          </Link>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Modify Event</h1>
          <p className="text-[var(--foreground-secondary)] mt-1">Update details for your private event.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Birthday Dinner"
                error={errors.title}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description *</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Share event details with guests"
                error={errors.description}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Image URL</label>
              <div className="space-y-3">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                    ${dragActive ? 'border-coral-500 bg-coral-500/10' : 'border-[var(--border)] hover:border-coral-500/50 hover:bg-[var(--background-elevated)]'}
                    ${uploadingImage ? 'pointer-events-none opacity-70' : ''}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  {uploadingImage ? (
                    <Loader2 className="h-8 w-8 mx-auto text-coral-500 animate-spin mb-2" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto text-[var(--foreground-muted)] mb-2" />
                  )}
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {uploadingImage ? 'Uploading...' : 'Drop an image here or click to upload'}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">JPG, PNG, WEBP, GIF · max 10MB</p>
                </div>

                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-[var(--foreground-muted)]" />
                  <Input
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value)
                      setImageError(null)
                    }}
                    placeholder="https://..."
                  />
                </div>

                {imageError && <p className="text-sm text-red-600 dark:text-red-400">{imageError}</p>}

                {imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--background-elevated)] max-w-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProxiedImageUrl(imageUrl) ?? imageUrl}
                      alt="Event image preview"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>When & Where</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Date & Time *</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--foreground-muted)]" />
                <Input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  error={errors.dateTime}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Location *</label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--foreground-muted)]" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Address or place name"
                  error={errors.location}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Max Guests</label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--foreground-muted)]" />
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(parseInt(e.target.value, 10) || 1)}
                  error={errors.maxGuests}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Split (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={enableCostSplit}
                onChange={(e) => setEnableCostSplit(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] text-coral-500"
              />
              <span className="text-sm text-[var(--foreground)]">Split costs among guests</span>
            </label>

            {enableCostSplit && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Cost per person</label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[var(--foreground-muted)]" />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={pricePerPerson}
                    onChange={(e) => setPricePerPerson(parseFloat(e.target.value) || 0)}
                    error={errors.pricePerPerson}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {errors.submit && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-500 text-sm">{errors.submit}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/events/${eventId}`)}
            disabled={saving}
            className="sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            className="sm:flex-1"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
