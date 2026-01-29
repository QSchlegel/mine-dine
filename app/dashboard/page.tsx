'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Utensils, Calendar, MessageSquare, User, Heart, ChefHat } from 'lucide-react'
import type { ProfileCompletionResult } from '@/lib/profile'
import ProfileCompletionWizard from '@/components/profile/ProfileCompletionWizard'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'

// Import reusable UI components
import {
  Container,
  PageHeader,
  Section,
  Alert,
  Button,
  StatCard,
  StatGrid,
  ActionCard,
  ActionGrid,
  QuickAction,
  QuickActionGrid,
  PageHeaderSkeleton,
  StatCardSkeleton,
  ActionCardSkeleton,
  QuickActionGridSkeleton,
} from '@/components/ui'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [stats, setStats] = useState({
    bookings: 0,
    upcomingBookings: 0,
  })
  const [profile, setProfile] = useState<any>(null)
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
        if (profileData.profile) {
          setProfile(profileData.profile)
          if (profileData.profile.name) {
            setUserName(profileData.profile.name)
          }
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

  const handleStartTour = () => {
    router.push('/dashboard/swipe?tour=guest')
  }

  const handleBookDinner = () => {
    router.push('/dinners')
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
      <div className="min-h-screen bg-[var(--background)]/80 backdrop-blur-sm py-16">
        <Container>
          <PageHeaderSkeleton size="lg" />

          {/* Stats skeleton */}
          <StatGrid columns={2} className="mb-12">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </StatGrid>

          {/* Featured actions skeleton */}
          <Section title="Get Started" spacing="lg">
            <ActionGrid>
              <ActionCardSkeleton variant="gradient" />
              <ActionCardSkeleton variant="gradient" />
            </ActionGrid>
          </Section>

          {/* Quick actions skeleton */}
          <Section title="Quick Actions">
            <QuickActionGridSkeleton count={4} columns={4} />
          </Section>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]/80 backdrop-blur-sm py-16">
      <Container>
        <PageHeader
          title={`${getGreeting()}${userName ? `, ${userName.split(' ')[0]}` : ''}`}
          subtitle="Here's what's happening with your dining experiences."
        />

        <OnboardingChecklist
          completion={profileCompletion}
          bookingsCount={stats.bookings}
          hasCompletedGuestTour={profile?.hasCompletedGuestTour}
          onOpenWizard={handleOpenWizard}
          onStartTour={handleStartTour}
          onBookDinner={handleBookDinner}
          className="mb-8"
        />

        {/* Profile Completion Banner */}
        {profileCompletion && !profileCompletion.isComplete && showCompletionBanner && (
          <Alert
            variant="warning"
            title="Complete Your Profile"
            dismissible
            onDismiss={() => setShowCompletionBanner(false)}
            className="mb-10"
            actions={
              <Button
                onClick={handleOpenWizard}
                className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white"
              >
                Complete Profile
              </Button>
            }
          >
            <p className="mb-3">
              Your profile is {profileCompletion.progress}% complete. Complete your profile to improve your matching experience and discover better dining opportunities.
            </p>
            {profileCompletion.recommendations.length > 0 && (
              <ul className="space-y-1">
                {profileCompletion.recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        {/* Quick Stats */}
        <StatGrid columns={2} className="mb-12">
          <StatCard
            title="Total Bookings"
            value={stats.bookings}
            subtitle={stats.bookings === 0 ? 'No bookings yet' : 'All time bookings'}
            icon={<Calendar className="h-4 w-4" />}
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingBookings}
            subtitle={stats.upcomingBookings === 0 ? 'No upcoming dinners' : 'Confirmed dinners'}
            icon={<Utensils className="h-4 w-4" />}
          />
        </StatGrid>

        {/* Featured Actions */}
        <Section title="Get Started" spacing="lg">
          <ActionGrid columns={2}>
            <ActionCard
              title="Discover Hosts"
              description="Swipe to find your perfect dining match"
              icon={<Heart className="h-6 w-6" />}
              variant="primary"
              onClick={() => router.push('/dashboard/swipe')}
            />
            <ActionCard
              title="Browse Dinners"
              description="Explore unique dining experiences near you"
              icon={<Utensils className="h-6 w-6" />}
              variant="secondary"
              onClick={() => router.push('/dinners')}
            />
          </ActionGrid>
        </Section>

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <QuickActionGrid columns={4}>
            <QuickAction
              label="My Bookings"
              icon={<Calendar className="h-5 w-5" />}
              variant="info"
              badge={stats.upcomingBookings > 0 ? `${stats.upcomingBookings} upcoming` : undefined}
              onClick={() => router.push('/dashboard/bookings')}
            />
            <QuickAction
              label="Messages"
              icon={<MessageSquare className="h-5 w-5" />}
              variant="secondary"
              onClick={() => router.push('/dashboard/messages')}
            />
            <QuickAction
              label="Profile"
              icon={<User className="h-5 w-5" />}
              variant="default"
              onClick={() => router.push('/dashboard/profile')}
            />
            <QuickAction
              label="Become Host"
              icon={<ChefHat className="h-5 w-5" />}
              variant="warning"
              onClick={() => router.push('/dashboard/host/apply')}
            />
          </QuickActionGrid>
        </Section>
      </Container>

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
