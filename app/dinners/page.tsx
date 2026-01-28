'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardImage } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { MapPin, Calendar, Users, Utensils, Search, Sparkles, ChefHat } from 'lucide-react'

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
    profileImageUrl: string | null
  }
  _count: {
    bookings: number
  }
}

const filterOptions = ['All', 'This Week', 'This Weekend', 'Next Week'] as const
type FilterOption = typeof filterOptions[number]

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] overflow-hidden">
      <div className="aspect-video bg-[var(--background-secondary)] shimmer" />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-3/4 bg-[var(--background-secondary)] rounded-lg shimmer" />
          <div className="h-4 w-1/2 bg-[var(--background-secondary)] rounded-lg shimmer" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-[var(--background-secondary)] rounded-lg shimmer" />
          <div className="h-4 w-2/3 bg-[var(--background-secondary)] rounded-lg shimmer" />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <div className="h-8 w-8 rounded-full bg-[var(--background-secondary)] shimmer" />
          <div className="h-4 w-24 bg-[var(--background-secondary)] rounded-lg shimmer" />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="col-span-full"
    >
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-12 text-center">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="relative">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
            <Utensils className="w-10 h-10 text-[var(--primary)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No dinners available yet
          </h3>
          <p className="text-[var(--foreground-secondary)] max-w-md mx-auto mb-6">
            Check back soon for unique dining experiences hosted by amazing chefs in your area.
          </p>
          <Button
            href="/dashboard/host/apply"
            variant="primary"
            size="lg"
            leftIcon={<ChefHat className="w-5 h-5" />}
            className="mt-4"
          >
            Host the first event
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default function BrowseDinnersPage() {
  const router = useRouter()
  const [dinners, setDinners] = useState<Dinner[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/dinners?status=PUBLISHED')
      .then((res) => res.json())
      .then((data) => {
        setDinners(data.dinners || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching dinners:', err)
        setLoading(false)
      })
  }, [])

  const filteredDinners = dinners.filter((dinner) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        dinner.title.toLowerCase().includes(query) ||
        dinner.description.toLowerCase().includes(query) ||
        dinner.location.toLowerCase().includes(query) ||
        dinner.host.name?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getAvailabilityStatus = (dinner: Dinner) => {
    const spotsLeft = dinner.maxGuests - dinner._count.bookings
    if (spotsLeft === 0) return { label: 'Sold Out', variant: 'danger' as const }
    if (spotsLeft <= 2) return { label: `${spotsLeft} spots left`, variant: 'warning' as const }
    return { label: `${spotsLeft} spots left`, variant: 'success' as const }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-6 sm:px-8 lg:px-12">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-pink-500/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-500/5 to-transparent blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/10 to-cyan-500/10">
              <Sparkles className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <h1 className="text-4xl font-bold text-[var(--foreground)]">
              Discover Dinners
            </h1>
          </div>
          <p className="text-lg text-[var(--foreground-secondary)] ml-14">
            Find unique dining experiences hosted by passionate chefs
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12 space-y-6"
        >
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
            <input
              type="text"
              placeholder="Search dinners, hosts, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-12 pr-4"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeFilter === filter
                    ? 'bg-[var(--primary)] text-white shadow-[var(--glow-primary)]'
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-[var(--background-elevated)] hover:text-[var(--foreground)]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Dinner Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="sync">
            {loading ? (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <SkeletonCard />
                  </motion.div>
                ))}
              </>
            ) : filteredDinners.length === 0 ? (
              <EmptyState />
            ) : (
              filteredDinners.map((dinner, index) => {
                const availability = getAvailabilityStatus(dinner)
                const isSoldOut = availability.label === 'Sold Out'

                return (
                  <motion.div
                    key={dinner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Card
                      hover="glow"
                      className={`group cursor-pointer overflow-hidden ${isSoldOut ? 'opacity-75' : ''}`}
                      onClick={() => router.push(`/dinners/${dinner.id}`)}
                    >
                      {/* Image */}
                      <CardImage
                        src={dinner.imageUrl || '/placeholder-dinner.jpg'}
                        alt={dinner.title}
                        aspectRatio="video"
                      >
                        {/* Price Badge */}
                        <div className="absolute top-4 right-4">
                          <div className="glass rounded-full px-3 py-1.5 text-sm font-bold text-[var(--foreground)]">
                            €{dinner.basePricePerPerson}
                          </div>
                        </div>
                        {/* Availability Badge */}
                        <div className="absolute bottom-4 left-4">
                          <Badge variant={availability.variant} size="sm" dot>
                            {availability.label}
                          </Badge>
                        </div>
                      </CardImage>

                      <CardContent className="p-6">
                        {/* Title */}
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2 line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                          {dinner.title}
                        </h3>

                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] mb-4">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(dinner.dateTime), 'EEE, MMM d · h:mm a')}</span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-[var(--foreground-muted)] mb-5 line-clamp-2">
                          {dinner.description}
                        </p>

                        {/* Location & Guests */}
                        <div className="flex items-center justify-between text-sm text-[var(--foreground-secondary)] mb-5">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{dinner.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>{dinner._count.bookings}/{dinner.maxGuests}</span>
                          </div>
                        </div>

                        {/* Host */}
                        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                          <Avatar
                            src={dinner.host.profileImageUrl}
                            name={dinner.host.name || 'Host'}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--foreground)] truncate">
                              {dinner.host.name || 'Anonymous Host'}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)]">Host</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {/* Results count */}
        {!loading && filteredDinners.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-sm text-[var(--foreground-muted)] mt-8"
          >
            Showing {filteredDinners.length} {filteredDinners.length === 1 ? 'dinner' : 'dinners'}
          </motion.p>
        )}
      </div>
    </div>
  )
}
