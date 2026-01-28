'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import Image from 'next/image'
import { Heart, X, Star, ChefHat, Utensils } from 'lucide-react'
import DiscoveryVisualization from '@/components/visualizations/presets/DiscoveryVisualization'
import MatchVisualization from '@/components/visualizations/presets/MatchVisualization'
import HelpButton from '@/components/guides/HelpButton'
import OnboardingTour from '@/components/guides/OnboardingTour'

interface Host {
  id: string
  name: string | null
  bio: string | null
  profileImageUrl: string | null
  coverImageUrl: string | null
  tags: Array<{
    id: string
    name: string
    category: string
  }>
  rating?: number
  reviewCount?: number
  matchScore?: number
  dinners?: Array<{
    id: string
    title: string
    cuisine: string | null
    imageUrl: string | null
    basePricePerPerson: number
  }>
  _count?: {
    dinners: number
  }
}

interface MatchData {
  userId: string
  hostId: string
  hostName: string | null
  hostImage: string | null
  matchedAt: string
}

export default function SwipePage() {
  const [hosts, setHosts] = useState<Host[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [swiping, setSwiping] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [showMatch, setShowMatch] = useState(false)
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [currentUser, setCurrentUser] = useState<{ name: string; profileImageUrl: string | null } | null>(null)
  const [showTour, setShowTour] = useState(false)
  const [hasCompletedTour, setHasCompletedTour] = useState(false)

  // Fetch hosts on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hostsRes, profileRes] = await Promise.all([
          fetch('/api/swipe'),
          fetch('/api/profiles'),
        ])

        if (!hostsRes.ok) {
          const errorData = await hostsRes.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to load hosts')
        }

        const hostsData = await hostsRes.json()
        const profileData = profileRes.ok ? await profileRes.json() : { profile: null }

        setHosts(hostsData.hosts || [])
        setCurrentUser(profileData.profile || null)
        
        // Check if user has completed guest tour
        if (profileData.profile && !profileData.profile.hasCompletedGuestTour) {
          setShowTour(true)
        } else {
          setHasCompletedTour(true)
        }
        
        setError(null)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSwipe = useCallback(async (action: 'LIKE' | 'PASS') => {
    if (currentIndex >= hosts.length || swiping) return

    const currentHost = hosts[currentIndex]
    setSwiping(true)
    setSwipeDirection(action === 'LIKE' ? 'right' : 'left')

    try {
      const response = await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: currentHost.id,
          action,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400 && data.error === 'Already swiped on this host') {
          // Skip to next host silently - user already swiped
          setCurrentIndex((prev) => prev + 1)
          setSwipeDirection(null)
          return
        }
        throw new Error(data.error || 'Failed to record swipe')
      }

      // Check for match
      if (data.matched && data.matchData) {
        setMatchData(data.matchData)
        setShowMatch(true)
      }

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 300))

      setCurrentIndex((prev) => prev + 1)
      setSwipeDirection(null)
    } catch (err) {
      console.error('Error processing swipe:', err)
      setError(err instanceof Error ? err.message : 'Failed to process swipe')
      setSwipeDirection(null)
    } finally {
      setSwiping(false)
    }
  }, [currentIndex, hosts, swiping])

  const handleMatchClose = useCallback(() => {
    setShowMatch(false)
    setMatchData(null)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handleSwipe('PASS')
    if (e.key === 'ArrowRight') handleSwipe('LIKE')
  }, [handleSwipe])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Motion values for drag-based animations
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Tilt effect based on drag position
  const rotateZ = useTransform(x, [-200, 0, 200], [-15, 0, 15])
  const rotateY = useTransform(x, [-200, 0, 200], [10, 0, -10])
  const rotateX = useTransform(y, [-100, 0, 100], [-5, 0, 5])

  // Dynamic glow based on drag direction
  const glowOpacity = useTransform(x, [-200, -50, 0, 50, 200], [1, 0.5, 0, 0.5, 1])
  const glowColor = useTransform(
    x,
    [-200, 0, 200],
    [
      '0 0 60px rgba(239, 68, 68, 0.6)', // Red glow left
      '0 0 0px rgba(0, 0, 0, 0)',          // No glow center
      '0 0 60px rgba(34, 197, 94, 0.6)',  // Green glow right
    ]
  )

  // Stamp opacity based on drag distance
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

  // Border color based on drag direction
  const borderColor = useTransform(
    x,
    [-200, -50, 0, 50, 200],
    [
      'rgba(239, 68, 68, 0.8)',
      'rgba(239, 68, 68, 0.3)',
      'rgba(0, 0, 0, 0)',
      'rgba(34, 197, 94, 0.3)',
      'rgba(34, 197, 94, 0.8)',
    ]
  )

  // Handle drag end with velocity consideration
  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    // Consider both offset AND velocity for more responsive feel
    if (offset > 100 || velocity > 500) {
      handleSwipe('LIKE')
    } else if (offset < -100 || velocity < -500) {
      handleSwipe('PASS')
    } else {
      // Reset position if not swiped far enough
      x.set(0)
      y.set(0)
    }
  }, [handleSwipe, x, y])

  if (loading) {
    return <LoadingScreen title="Discovering hosts" subtitle="Finding great matches for you" />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
            <p className="text-foreground-secondary mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentIndex >= hosts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">All caught up!</h2>
            <p className="text-foreground-secondary mb-6">
              You&apos;ve seen all available hosts. Check back later for new chefs!
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentHost = hosts[currentIndex]
  const tagsByCategory = currentHost.tags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag.name)
    return acc
  }, {} as Record<string, string[]>)

  const handleTourComplete = async () => {
    try {
      await fetch('/api/profiles/tour-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourType: 'guest' }),
      })
      setHasCompletedTour(true)
    } catch (error) {
      console.error('Error marking tour as complete:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <HelpButton pageId="swipe" />
      <OnboardingTour
        tourType="guest"
        isOpen={showTour && !hasCompletedTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
      />
      {/* 3D Network Graph Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <DiscoveryVisualization
          hosts={hosts.map(h => ({
            id: h.id,
            name: h.name || 'Host',
            profileImageUrl: h.profileImageUrl,
            tags: h.tags,
            rating: h.rating,
            matchScore: h.matchScore,
          }))}
          currentHostId={currentHost?.id}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Utensils className="w-6 h-6 text-primary-500" />
              Discover Hosts
            </h1>
            <p className="text-sm text-foreground-secondary mt-1">
              Swipe right to like, left to pass • Use arrow keys
            </p>
          </div>

          {/* Card Stack */}
          <div className="relative h-[550px]" style={{ perspective: '1000px' }}>
            {/* Background cards (stack effect) */}
            {hosts.slice(currentIndex + 1, currentIndex + 3).map((host, i) => (
              <motion.div
                key={host.id}
                className="absolute inset-0 pointer-events-none"
                style={{
                  scale: 1 - (i + 1) * 0.05,
                  y: (i + 1) * 8,
                  zIndex: 8 - i,
                }}
              >
                <Card className="h-full overflow-hidden shadow-lg border-0 opacity-60">
                  <div className="relative h-56 w-full bg-gradient-to-br from-primary-400 to-primary-600">
                    {host.coverImageUrl && (
                      <Image
                        src={host.coverImageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 520px"
                        className="object-cover"
                      />
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Main swipeable card */}
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentHost.id}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                style={{
                  x,
                  y,
                  rotateX,
                  rotateY,
                  rotateZ,
                  boxShadow: glowColor,
                  zIndex: 10,
                }}
                drag={!swiping}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.9}
                onDragEnd={handleDragEnd}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{
                  x: swipeDirection === 'right' ? 400 : swipeDirection === 'left' ? -400 : 0,
                  opacity: 0,
                  rotate: swipeDirection === 'right' ? 20 : swipeDirection === 'left' ? -20 : 0,
                  transition: { type: 'spring', stiffness: 200, damping: 25 },
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {/* LIKE stamp */}
                <motion.div
                  className="absolute top-8 left-8 z-20 rotate-[-20deg] border-4 border-green-500 text-green-500 font-black text-3xl px-4 py-2 rounded-lg pointer-events-none"
                  style={{ opacity: likeOpacity }}
                >
                  LIKE
                </motion.div>

                {/* NOPE stamp */}
                <motion.div
                  className="absolute top-8 right-8 z-20 rotate-[20deg] border-4 border-red-500 text-red-500 font-black text-3xl px-4 py-2 rounded-lg pointer-events-none"
                  style={{ opacity: nopeOpacity }}
                >
                  NOPE
                </motion.div>

                <motion.div
                  className="h-full rounded-2xl overflow-hidden"
                  style={{
                    borderWidth: 3,
                    borderStyle: 'solid',
                    borderColor,
                  }}
                >
                  <Card className="h-full overflow-hidden shadow-xl border-0">
                  {/* Cover Image */}
                  <div className="relative h-56 w-full bg-gradient-to-br from-primary-400 to-primary-600">
                    {currentHost.coverImageUrl ? (
                      <Image
                        src={currentHost.coverImageUrl}
                        alt={currentHost.name || 'Host'}
                        fill
                        sizes="(max-width: 1024px) 100vw, 520px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ChefHat className="w-20 h-20 text-white/30" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Rating badge */}
                    {currentHost.rating && currentHost.rating > 0 && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-sm font-medium">
                          {currentHost.rating.toFixed(1)}
                        </span>
                        {currentHost.reviewCount && (
                          <span className="text-white/70 text-xs">
                            ({currentHost.reviewCount})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Match score */}
                    {currentHost.matchScore && currentHost.matchScore > 0.3 && (
                      <div className="absolute top-4 left-4 bg-accent-500/90 backdrop-blur-sm px-2 py-1 rounded-full">
                        <span className="text-white text-xs font-medium">
                          {Math.round(currentHost.matchScore * 100)}% Match
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5 h-[calc(100%-14rem)] overflow-y-auto">
                    {/* Profile header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden ring-2 ring-primary-500/50 flex-shrink-0">
                        {currentHost.profileImageUrl ? (
                          <Image
                            src={currentHost.profileImageUrl}
                            alt={currentHost.name || 'Host'}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              {(currentHost.name || 'H').charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-foreground truncate">
                          {currentHost.name || 'Anonymous Host'}
                        </h2>
                        {currentHost._count && (
                          <p className="text-sm text-foreground-secondary">
                            {currentHost._count.dinners} dinner{currentHost._count.dinners !== 1 ? 's' : ''} hosted
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    {currentHost.bio && (
                      <p className="text-foreground-secondary text-sm mb-4 line-clamp-3">
                        {currentHost.bio}
                      </p>
                    )}

                    {/* Tags */}
                    {Object.keys(tagsByCategory).length > 0 && (
                      <div className="space-y-3">
                        {Object.entries(tagsByCategory).map(([category, tags]) => (
                          <div key={category}>
                            <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-1.5">
                              {category}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sample dinners */}
                    {currentHost.dinners && currentHost.dinners.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2">
                          Upcoming Dinners
                        </p>
                        <div className="space-y-2">
                          {currentHost.dinners.slice(0, 2).map((dinner) => (
                            <div
                              key={dinner.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div className="w-2 h-2 rounded-full bg-primary-500" />
                              <span className="text-foreground truncate flex-1">
                                {dinner.title}
                              </span>
                              <span className="text-foreground-secondary">
                                €{dinner.basePricePerPerson}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Swipe indicators (shown after swipe is initiated) */}
            <AnimatePresence>
              {swipeDirection === 'right' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1.1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                >
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/50">
                    <Heart className="w-14 h-14 text-white fill-white" />
                  </div>
                </motion.div>
              )}
              {swipeDirection === 'left' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1.1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                >
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                    <X className="w-14 h-14 text-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-8 mt-6" data-tour="swipe">
            <motion.button
              whileHover={{ scale: 1.15, boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('PASS')}
              disabled={swiping}
              className="w-18 h-18 p-5 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border-2 border-red-500/30 flex items-center justify-center transition-all disabled:opacity-50 shadow-lg"
            >
              <X className="w-9 h-9 text-red-500" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15, boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('LIKE')}
              disabled={swiping}
              className="w-18 h-18 p-5 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 border-2 border-green-500/30 flex items-center justify-center transition-all disabled:opacity-50 shadow-lg"
            >
              <Heart className="w-9 h-9 text-green-500" />
            </motion.button>
          </div>

          {/* Progress indicator */}
          <div className="mt-6 text-center">
            <p className="text-sm text-foreground-secondary">
              {currentIndex + 1} of {hosts.length}
            </p>
            <div className="mt-2 h-1 bg-border rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / hosts.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Match celebration overlay */}
      <MatchVisualization
        isActive={showMatch}
        userName={currentUser?.name}
        hostName={matchData?.hostName || undefined}
        userImage={currentUser?.profileImageUrl}
        hostImage={matchData?.hostImage}
        onComplete={handleMatchClose}
      />
    </div>
  )
}
