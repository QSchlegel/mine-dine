'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Utensils, Calendar, MessageSquare, User, Heart, AlertCircle, X, ChefHat, ArrowRight } from 'lucide-react'
import type { ProfileCompletionResult } from '@/lib/profile'
import ProfileCompletionWizard from '@/components/profile/ProfileCompletionWizard'

// Skeleton component for loading states
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[var(--background-secondary)] rounded ${className || ''}`} />
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [stats, setStats] = useState({
    bookings: 0,
    upcomingBookings: 0,
  })
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionResult | null>(null)
  const [showCompletionBanner, setShowCompletionBanner] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardInitialData, setWizardInitialData] = useState<{
    name?: string | null
    bio?: string | null
    selectedTags?: string[]
  } | null>(null)

  const fetchDashboardData = () => {
    Promise.all([
      fetch('/api/bookings').then((res) => res.ok ? res.json() : { bookings: [] }),
      fetch('/api/profiles/completion').then((res) => res.ok ? res.json() : { completion: null }),
      fetch('/api/profiles').then((res) => res.ok ? res.json() : { profile: null }),
    ])
      .then(([bookingsData, completionData, profileData]) => {
        // Process bookings with null safety
        const bookings = bookingsData.bookings || []
        const upcoming = bookings.filter((b: any) => {
          if (!b.dinner?.dateTime) return false
          const date = new Date(b.dinner.dateTime)
          return date > new Date() && b.status === 'CONFIRMED'
        })
        setStats({
          bookings: bookings.length,
          upcomingBookings: upcoming.length,
        })

        // Process profile completion
        if (completionData.completion) {
          setProfileCompletion(completionData.completion)
        }

        // Set user name for personalization
        if (profileData.profile?.name) {
          setUserName(profileData.profile.name)
        }

        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching data:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleOpenWizard = async () => {
    try {
      // Fetch profile data for wizard
      const [profileRes, tagsRes] = await Promise.all([
        fetch('/api/profiles').then((res) => res.json()),
        fetch('/api/tags').then((res) => res.json()),
      ])

      const profile = profileRes.profile
      const selectedTags = profile?.userTags?.map((ut: any) => ut.tag.id) || []

      setWizardInitialData({
        name: profile?.name || null,
        bio: profile?.bio || null,
        selectedTags,
      })
      setShowWizard(true)
    } catch (err) {
      console.error('Error opening wizard:', err)
    }
  }

  const handleWizardComplete = () => {
    // Refresh dashboard data
    fetchDashboardData()
    setShowWizard(false)
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick actions skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            {getGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-2 text-[var(--foreground-secondary)]">Here&apos;s what&apos;s happening with your dining experiences.</p>
        </div>

        {/* Profile Completion Banner */}
        {profileCompletion && !profileCompletion.isComplete && showCompletionBanner && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 relative">
            <button
              onClick={() => setShowCompletionBanner(false)}
              className="absolute top-2 right-2 text-amber-600 hover:text-amber-800"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  Your profile is {profileCompletion.progress}% complete. Complete your profile to improve your matching experience and discover better dining opportunities.
                </p>
                {profileCompletion.recommendations.length > 0 && (
                  <ul className="text-sm text-amber-700 space-y-1 mb-3">
                    {profileCompletion.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  onClick={handleOpenWizard}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Complete Profile
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bookings}</div>
              <p className="text-xs text-muted-foreground">
                {stats.bookings === 0 ? 'No bookings yet' : 'All time bookings'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
              <p className="text-xs text-muted-foreground">
                {stats.upcomingBookings === 0 ? 'No upcoming dinners' : 'Confirmed dinners'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Actions - More prominent */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Get Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] bg-gradient-to-br from-orange-500 to-pink-500 text-white border-0"
              onClick={() => router.push('/dashboard/swipe')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-6 w-6" />
                      <span className="font-bold text-lg">Discover Hosts</span>
                    </div>
                    <p className="text-white/90 text-sm">
                      Swipe to find your perfect dining match
                    </p>
                  </div>
                  <ArrowRight className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-0"
              onClick={() => router.push('/dinners')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Utensils className="h-6 w-6" />
                      <span className="font-bold text-lg">Browse Dinners</span>
                    </div>
                    <p className="text-white/90 text-sm">
                      Explore unique dining experiences near you
                    </p>
                  </div>
                  <ArrowRight className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions - Secondary prominence */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => router.push('/dashboard/bookings')}
            >
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <p className="font-medium text-sm text-[var(--foreground)]">My Bookings</p>
                {stats.upcomingBookings > 0 && (
                  <span className="text-xs text-blue-600">{stats.upcomingBookings} upcoming</span>
                )}
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => router.push('/dashboard/messages')}
            >
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <p className="font-medium text-sm text-[var(--foreground)]">Messages</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => router.push('/dashboard/profile')}
            >
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <p className="font-medium text-sm text-[var(--foreground)]">Profile</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => router.push('/dashboard/host/apply')}
            >
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <ChefHat className="h-5 w-5 text-amber-600" />
                </div>
                <p className="font-medium text-sm text-[var(--foreground)]">Become Host</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Profile Completion Wizard */}
      <ProfileCompletionWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleWizardComplete}
        initialData={wizardInitialData || undefined}
      />
    </div>
  )
}
