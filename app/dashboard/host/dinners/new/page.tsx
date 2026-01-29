'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
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
} from 'lucide-react'
import Link from 'next/link'
import PlanModeToggle, { type PlanningMode } from '@/components/dinner-planning/PlanModeToggle'
import AIPlanner from '@/components/dinner-planning/AIPlanner'
import type { DinnerPlan } from '@/lib/ai/dinner-planner'
import HelpButton from '@/components/guides/HelpButton'

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

export default function CreateDinnerPage() {
  const router = useRouter()
  const [planningMode, setPlanningMode] = useState<PlanningMode>('manual')
  const [aiPlan, setAiPlan] = useState<DinnerPlan | null>(null)
  const [loading, setLoading] = useState(false)
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
  const [locationSearchTerm, setLocationSearchTerm] = useState('')
  const [locationResults, setLocationResults] = useState<
    Array<{ label: string; city: string | null; state: string | null; country: string | null }>
  >([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)

  // Add-on form state
  const [newAddOnName, setNewAddOnName] = useState('')
  const [newAddOnDescription, setNewAddOnDescription] = useState('')
  const [newAddOnPrice, setNewAddOnPrice] = useState(10)

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedPlan = window.localStorage.getItem('mindine_pending_dinner_plan')
    if (!storedPlan) return
    try {
      const parsedPlan = JSON.parse(storedPlan) as DinnerPlan
      setAiPlan(parsedPlan)
      setPlanningMode('manual')
      window.localStorage.removeItem('mindine_pending_dinner_plan')
    } catch (error) {
      console.warn('Failed to load pending dinner plan:', error)
    }
  }, [])

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags')
        const data = await res.json()
        setTags(data.tags || [])
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    fetchTags()
  }, [])

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

  const searchLocations = async () => {
    const q = locationSearchTerm.trim() || location.trim()
    if (!q) return
    setIsSearchingLocation(true)
    try {
      const res = await fetch(`/api/locations/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search locations')
      }
      setLocationResults(data.results || [])
    } catch (error) {
      console.error('Location search failed:', error)
      setLocationResults([])
    } finally {
      setIsSearchingLocation(false)
    }
  }

  const handleAddAddOn = () => {
    if (!newAddOnName.trim() || newAddOnPrice <= 0) return

    setAddOns(prev => [
      ...prev,
      {
        name: newAddOnName.trim(),
        description: newAddOnDescription.trim(),
        price: newAddOnPrice,
      },
    ])

    // Reset form
    setNewAddOnName('')
    setNewAddOnDescription('')
    setNewAddOnPrice(10)
  }

  const handleRemoveAddOn = (index: number) => {
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
    else if (new Date(dateTime) <= new Date()) newErrors.dateTime = 'Date must be in the future'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePlanGenerated = (plan: DinnerPlan) => {
    setAiPlan(plan)
    // Pre-fill form with AI-generated data
    if (plan.description) {
      setDescription(plan.description)
    }
    if (plan.pricingBreakdown.suggestedPricePerPerson) {
      setBasePricePerPerson(plan.pricingBreakdown.suggestedPricePerPerson)
    }
    if (!title && plan.menuItems?.length) {
      const heroDish = plan.menuItems.find((item) => item.course.toLowerCase().includes('main')) || plan.menuItems[0]
      if (heroDish?.name) {
        setTitle(`${heroDish.name} Dinner`)
      }
    }
    // Switch to manual mode to review and edit
    setPlanningMode('manual')
  }

  const openPlanInMineBot = () => {
    if (typeof window !== 'undefined' && aiPlan) {
      window.localStorage.setItem('mindine_pending_dinner_plan', JSON.stringify(aiPlan))
    }
    router.push('/minebot/plan-dinner')
  }

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!validateForm()) return

    setLoading(true)

    try {
      // Create dinner
      const dinnerRes = await fetch('/api/dinners', {
        method: 'POST',
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
          status,
          planningMode: aiPlan ? 'AI_GENERATED' : 'MANUAL',
          aiPlanData: aiPlan ? {
            menuItems: aiPlan.menuItems,
            ingredientList: aiPlan.ingredientList,
            prepTimeline: aiPlan.prepTimeline,
          } : undefined,
        }),
      })

      if (!dinnerRes.ok) {
        const error = await dinnerRes.json()
        throw new Error(error.error || 'Failed to create dinner')
      }

      const { dinner } = await dinnerRes.json()

      // Save AI plan if exists
      if (aiPlan && dinner.id) {
        await fetch(`/api/dinners/plan/${dinner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menuItems: aiPlan.menuItems,
            ingredientList: aiPlan.ingredientList,
            prepTimeline: aiPlan.prepTimeline,
            pricingBreakdown: aiPlan.pricingBreakdown,
            aiResponse: JSON.stringify(aiPlan),
          }),
        })
      }

      // Create add-ons if any
      if (addOns.length > 0) {
        for (const addOn of addOns) {
          await fetch(`/api/dinners/${dinner.id}/add-ons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addOn),
          })
        }
      }

      router.push('/dashboard/host/dinners')
    } catch (error) {
      console.error('Error creating dinner:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create dinner' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <HelpButton pageId="dinner-create" />
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <ChefHat className="w-8 h-8 text-primary-500" />
                Create New Dinner
              </h1>
              <p className="text-foreground-secondary mt-1">
                Share your culinary creation with guests
              </p>
            </div>
          </div>
          {/* Plan Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <PlanModeToggle
              mode={planningMode}
              onChange={setPlanningMode}
            />
          </div>
        </div>

        {/* AI Planner or Manual Form */}
        {planningMode === 'ai' ? (
          <AIPlanner
            onPlanGenerated={handlePlanGenerated}
            onCancel={() => setPlanningMode('manual')}
          />
        ) : (
          <>
            {/* Show AI plan summary if available */}
            {aiPlan && (
              <Card className="mb-6 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">AI Plan Generated</h3>
                      <p className="text-sm text-foreground-secondary">
                        {aiPlan.menuItems.length} menu items • {aiPlan.ingredientList.length} ingredients
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAiPlan(null)
                        setPlanningMode('ai')
                      }}
                    >
                      View Plan
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={openPlanInMineBot}
                    >
                      Open in Dine Bot
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                  placeholder="Describe your dinner experience, menu, and what makes it special..."
                  rows={4}
                  error={errors.description}
                />
                <p className="text-xs text-foreground-muted mt-1">
                  {description.length}/2000 characters (minimum 20)
                </p>
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
                    min={new Date().toISOString().slice(0, 16)}
                    error={errors.dateTime}
                  />
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
                      min={1}
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
                <div className="mt-3 space-y-2">
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input
                      value={locationSearchTerm}
                      onChange={(e) => setLocationSearchTerm(e.target.value)}
                      placeholder="Search city, neighborhood, or address"
                    />
                    <Button
                      variant="secondary"
                      onClick={searchLocations}
                      disabled={isSearchingLocation || (!locationSearchTerm.trim() && !location.trim())}
                    >
                      {isSearchingLocation ? 'Searching…' : 'Find location'}
                    </Button>
                  </div>
                  {locationResults.length > 0 && (
                    <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 space-y-2 max-h-48 overflow-y-auto">
                      {locationResults.map((result, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setLocation(result.label)
                            setLocationSearchTerm(result.label)
                            setLocationResults([])
                          }}
                          className="w-full text-left p-2 rounded-md hover:bg-background border border-transparent hover:border-border transition"
                        >
                          <p className="text-sm font-medium text-foreground">{result.label}</p>
                          <p className="text-xs text-foreground-muted">
                            {[result.city, result.state, result.country].filter(Boolean).join(', ')}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
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
                    error={errors.basePricePerPerson}
                  />
                </div>
                <p className="text-xs text-foreground-muted mt-1">
                  Recommended: €50 per person
                </p>
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
                        key={index}
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
                            onClick={() => handleRemoveAddOn(index)}
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
                    placeholder="Description (optional)"
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
                <p className="text-xs text-foreground-muted mt-2">
                  Add optional extras like wine pairing, special desserts, etc.
                </p>
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
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Image URL
                </label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  error={errors.imageUrl}
                />
                <p className="text-xs text-foreground-muted mt-1">
                  Upload your image to a service like AWS S3 and paste the URL here
                </p>
              </div>

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
              <p className="text-sm text-foreground-secondary mb-4">
                Select tags to help guests discover your dinner
              </p>

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
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => handleSubmit('DRAFT')}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit('PUBLISHED')}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Publish Dinner
            </Button>
          </div>
        </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
