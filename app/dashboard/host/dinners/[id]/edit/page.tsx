'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  ChefHat,
  Calendar,
  MapPin,
  Users,
  Euro,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowLeft,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

interface Tag {
  id: string
  name: string
  category: string
}

interface AddOn {
  id?: string
  name: string
  description: string
  price: number
}

interface Dinner {
  id: string
  title: string
  description: string
  cuisine: string | null
  maxGuests: number
  basePricePerPerson: number
  location: string
  dateTime: string
  imageUrl: string | null
  status: string
  tags: Array<{ tag: Tag }>
  addOns: AddOn[]
  _count?: {
    bookings: number
  }
}

export default function EditDinnerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dinner, setDinner] = useState<Dinner | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [addOns, setAddOns] = useState<AddOn[]>([])

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [maxGuests, setMaxGuests] = useState(8)
  const [basePricePerPerson, setBasePricePerPerson] = useState(50)
  const [location, setLocation] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState('DRAFT')

  // Add-on form state
  const [newAddOnName, setNewAddOnName] = useState('')
  const [newAddOnDescription, setNewAddOnDescription] = useState('')
  const [newAddOnPrice, setNewAddOnPrice] = useState(10)

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch dinner and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dinnerRes, tagsRes] = await Promise.all([
          fetch(`/api/dinners/${resolvedParams.id}`),
          fetch('/api/tags'),
        ])

        if (!dinnerRes.ok) {
          throw new Error('Dinner not found')
        }

        const dinnerData = await dinnerRes.json()
        const tagsData = await tagsRes.json()

        const d = dinnerData.dinner
        setDinner(d)
        setTags(tagsData.tags || [])

        // Populate form
        setTitle(d.title)
        setDescription(d.description)
        setCuisine(d.cuisine || '')
        setMaxGuests(d.maxGuests)
        setBasePricePerPerson(d.basePricePerPerson)
        setLocation(d.location)
        setDateTime(new Date(d.dateTime).toISOString().slice(0, 16))
        setImageUrl(d.imageUrl || '')
        setStatus(d.status)
        setSelectedTagIds(d.tags?.map((t: { tag: Tag }) => t.tag.id) || [])
        setAddOns(d.addOns || [])
      } catch (error) {
        console.error('Error fetching dinner:', error)
        setErrors({ fetch: 'Failed to load dinner' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id])

  const tagsByCategory = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {} as Record<string, Tag[]>)

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleAddAddOn = async () => {
    if (!newAddOnName.trim() || newAddOnPrice <= 0) return

    try {
      const res = await fetch(`/api/dinners/${resolvedParams.id}/add-ons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAddOnName.trim(),
          description: newAddOnDescription.trim(),
          price: newAddOnPrice,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAddOns(prev => [...prev, data.addOn])
      }
    } catch (error) {
      console.error('Error adding add-on:', error)
    }

    // Reset form
    setNewAddOnName('')
    setNewAddOnDescription('')
    setNewAddOnPrice(10)
  }

  const handleRemoveAddOn = async (index: number, addOnId?: string) => {
    if (addOnId) {
      try {
        await fetch(`/api/dinners/${resolvedParams.id}/add-ons?addOnId=${addOnId}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Error removing add-on:', error)
        return
      }
    }
    setAddOns(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (title.length < 3) newErrors.title = 'Title must be at least 3 characters'
    if (description.length < 20) newErrors.description = 'Description must be at least 20 characters'
    if (maxGuests < 1 || maxGuests > 50) newErrors.maxGuests = 'Max guests must be between 1 and 50'
    if (basePricePerPerson <= 0 || basePricePerPerson > 1000) newErrors.basePricePerPerson = 'Price must be between €1 and €1000'
    if (location.length < 5) newErrors.location = 'Location must be at least 5 characters'
    if (!dateTime) newErrors.dateTime = 'Date and time is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (newStatus?: string) => {
    if (!validateForm()) return

    setSaving(true)

    try {
      const res = await fetch(`/api/dinners/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          cuisine: cuisine || undefined,
          maxGuests,
          basePricePerPerson,
          location,
          dateTime: new Date(dateTime).toISOString(),
          imageUrl: imageUrl || undefined,
          tagIds: selectedTagIds,
          status: newStatus || status,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update dinner')
      }

      router.push('/dashboard/host/dinners')
    } catch (error) {
      console.error('Error updating dinner:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to update dinner' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this dinner? This action cannot be undone.')) {
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/dinners/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (!res.ok) {
        throw new Error('Failed to cancel dinner')
      }

      router.push('/dashboard/host/dinners')
    } catch (error) {
      console.error('Error cancelling dinner:', error)
      setErrors({ submit: 'Failed to cancel dinner' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (errors.fetch || !dinner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Dinner Not Found</h2>
            <p className="text-foreground-secondary mb-6">
              The dinner you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.
            </p>
            <Link href="/dashboard/host/dinners">
              <Button>Back to Dinners</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasBookings = (dinner._count?.bookings || 0) > 0

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/host/dinners"
            className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dinners
          </Link>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-primary-500" />
            Edit Dinner
          </h1>
          <p className="text-foreground-secondary mt-1">
            Update your dinner details
          </p>
        </div>

        {/* Warning for dinners with bookings */}
        {hasBookings && (
          <div className="mb-6 p-4 bg-warning-100 dark:bg-warning-900/20 border border-warning-300 dark:border-warning-800 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning-800 dark:text-warning-200">
                This dinner has {dinner._count?.bookings} booking(s)
              </p>
              <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
                Some fields like date/time cannot be changed. Contact guests if you need to make significant changes.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Dinner Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Authentic Italian Pasta Night"
                  error={errors.title}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description *
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your dinner experience..."
                  rows={4}
                  error={errors.description}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Cuisine Type
                </label>
                <Input
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g., Italian, Asian, Mediterranean"
                />
              </div>
            </CardContent>
          </Card>

          {/* Scheduling & Capacity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                Scheduling & Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Date & Time *
                  </label>
                  <Input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    disabled={hasBookings}
                    error={errors.dateTime}
                  />
                  {hasBookings && (
                    <p className="text-xs text-warning-600 mt-1">Cannot change with active bookings</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Max Guests *
                  </label>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-foreground-muted" />
                    <Input
                      type="number"
                      value={maxGuests}
                      onChange={(e) => setMaxGuests(parseInt(e.target.value) || 0)}
                      min={hasBookings ? dinner._count?.bookings || 1 : 1}
                      max={50}
                      error={errors.maxGuests}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Location *
                </label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Amsterdam, Netherlands"
                    error={errors.location}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Euro className="w-5 h-5 text-primary-500" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Base Price per Person *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-foreground-muted">€</span>
                  <Input
                    type="number"
                    value={basePricePerPerson}
                    onChange={(e) => setBasePricePerPerson(parseFloat(e.target.value) || 0)}
                    min={1}
                    max={1000}
                    step={0.5}
                    disabled={hasBookings}
                    error={errors.basePricePerPerson}
                  />
                </div>
                {hasBookings && (
                  <p className="text-xs text-warning-600 mt-1">Cannot change with active bookings</p>
                )}
              </div>

              {/* Add-ons */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Optional Add-ons
                </label>

                {addOns.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {addOns.map((addOn, index) => (
                      <div
                        key={addOn.id || index}
                        className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-foreground">{addOn.name}</p>
                          {addOn.description && (
                            <p className="text-sm text-foreground-secondary">{addOn.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-primary-500 font-medium">€{addOn.price}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAddOn(index, addOn.id)}
                            className="text-danger-500 hover:text-danger-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={newAddOnName}
                    onChange={(e) => setNewAddOnName(e.target.value)}
                    placeholder="Add-on name"
                  />
                  <Input
                    value={newAddOnDescription}
                    onChange={(e) => setNewAddOnDescription(e.target.value)}
                    placeholder="Description"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-foreground-muted">€</span>
                    <Input
                      type="number"
                      value={newAddOnPrice}
                      onChange={(e) => setNewAddOnPrice(parseFloat(e.target.value) || 0)}
                      min={1}
                      step={0.5}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAddOn}
                      disabled={!newAddOnName.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary-500" />
                Cover Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />

              {imageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-foreground mb-2">Preview</p>
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

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
                <div key={category} className="mb-4">
                  <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2">
                    {category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          selectedTagIds.includes(tag.id)
                            ? 'bg-primary-500 text-white'
                            : 'bg-background-secondary text-foreground-secondary hover:bg-background-elevated'
                        }`}
                      >
                        {selectedTagIds.includes(tag.id) && (
                          <Check className="w-3 h-3 inline mr-1" />
                        )}
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Error display */}
          {errors.submit && (
            <div className="p-4 bg-danger-100 dark:bg-danger-900/20 border border-danger-300 dark:border-danger-800 rounded-lg">
              <p className="text-danger-700 dark:text-danger-300">{errors.submit}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={saving || status === 'CANCELLED'}
            >
              Cancel Dinner
            </Button>

            <div className="flex gap-4">
              {status !== 'PUBLISHED' && (
                <Button
                  variant="outline"
                  onClick={() => handleSubmit('DRAFT')}
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Draft
                </Button>
              )}
              <Button
                onClick={() => handleSubmit(status === 'PUBLISHED' ? 'PUBLISHED' : 'PUBLISHED')}
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {status === 'PUBLISHED' ? 'Save Changes' : 'Publish'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
