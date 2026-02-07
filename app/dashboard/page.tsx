'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Utensils, Calendar, MessageSquare, User, Heart, ChefHat } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ProfileCompletionResult } from '@/lib/profile'
import ProfileCompletionWizard from '@/components/profile/ProfileCompletionWizard'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import OnboardingFlowDialog from '@/components/onboarding/OnboardingFlowDialog'

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
  const [showOnboardingFlow, setShowOnboardingFlow] = useState(false)
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

  useEffect(() => {
    if (loading) return
    const needsOnboarding = !profileCompletion?.isComplete
      || !profile?.hasCompletedGuestTour
      || stats.bookings === 0

    const hasSeenFlow = typeof window !== 'undefined'
      && localStorage.getItem('md_onboarding_flow_seen') === '1'

    if (needsOnboarding && !hasSeenFlow) {
      setShowOnboardingFlow(true)
    }
  }, [loading, profileCompletion, profile?.hasCompletedGuestTour, stats.bookings])

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

  const handleCloseOnboardingFlow = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('md_onboarding_flow_seen', '1')
    }
    setShowOnboardingFlow(false)
  }

  const handleFinishOnboardingFlow = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('md_onboarding_flow_seen', '1')
    }
    setShowOnboardingFlow(false)
    fetchDashboardData()
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
      <div className="relative min-h-screen bg-[var(--background)]/90 backdrop-blur-sm py-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_20%_20%,rgba(78,224,200,0.08),transparent_25%),radial-gradient(circle_at_82%_18%,rgba(244,114,154,0.1),transparent_30%),radial-gradient(circle_at_40%_80%,rgba(246,197,107,0.07),transparent_24%)]" />
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
    <div className="relative min-h-screen bg-[var(--background)]/90 backdrop-blur-sm py-16 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_18%_18%,rgba(78,224,200,0.08),transparent_25%),radial-gradient(circle_at_86%_12%,rgba(244,114,154,0.12),transparent_32%),radial-gradient(circle_at_48%_82%,rgba(246,197,107,0.07),transparent_25%)]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {[0, 1, 2].map((idx) => (
          <motion.span
            key={idx}
            className="absolute h-40 w-40 md:h-56 md:w-56 rounded-full blur-3xl bg-gradient-to-br from-coral-500/12 via-amber-400/8 to-accent-500/10"
            style={{
              top: `${idx === 0 ? 14 : idx === 1 ? 48 : 72}%`,
              left: `${idx === 0 ? 8 : idx === 1 ? 76 : 36}%`,
            }}
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.04, 1],
              opacity: [0.18, 0.26, 0.18],
            }}
            transition={{
              duration: 12 + idx * 2,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
              delay: idx * 1.2,
            }}
          />
        ))}
      </motion.div>
      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <PageHeader
            title={`${getGreeting()}${userName ? `, ${userName.split(' ')[0]}` : ''}`}
            subtitle="Here's what's happening with your dining experiences."
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: 'Momentum',
                value: stats.bookings === 0 ? 'First dinner awaits' : `${stats.bookings} booking${stats.bookings === 1 ? '' : 's'}`,
                glow: 'from-coral-500/30 to-amber-400/25',
              },
              {
                label: 'Next Step',
                value: profileCompletion?.isComplete ? 'Explore new hosts' : `${profileCompletion?.progress ?? 0}% profile ready`,
                glow: 'from-accent-500/25 via-coral-500/20 to-amber-400/20',
              },
              {
                label: 'Vibe Check',
                value: profile?.bio ? 'Profile feels personal' : 'Add a quick bio',
                glow: 'from-amber-500/25 to-coral-500/20',
              },
            ].map((badge, idx) => (
              <motion.div
                key={badge.label}
                className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]/80 px-4 py-3 shadow-refined backdrop-blur-sm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * idx, duration: 0.45, ease: 'easeOut' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-60" style={{ backgroundImage: `linear-gradient(120deg, var(--background) 10%, transparent 40%, var(--background) 90%)` }} />
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${badge.glow} opacity-0`}
                  animate={{ opacity: [0, 0.35, 0] }}
                  transition={{ duration: 6 + idx * 0.6, repeat: Infinity, repeatDelay: 5 }}
                />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-[var(--foreground-muted)]">{badge.label}</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{badge.value}</p>
                  </div>
                  <motion.span
                    className="h-2 w-2 rounded-full bg-coral-500/80 shadow-glow-coral"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.9, 0.6, 0.9] }}
                    transition={{ duration: 3.5, repeat: Infinity, repeatType: 'mirror', delay: idx * 0.5 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
        >
          <OnboardingChecklist
            completion={profileCompletion}
            bookingsCount={stats.bookings}
            hasCompletedGuestTour={profile?.hasCompletedGuestTour}
            onOpenWizard={handleOpenWizard}
            onStartTour={handleStartTour}
            onBookDinner={handleBookDinner}
            onStartGuidedFlow={() => setShowOnboardingFlow(true)}
            className="mb-8"
          />
        </motion.div>

        {/* Profile Completion Banner */}
        {profileCompletion && !profileCompletion.isComplete && showCompletionBanner && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Alert
              variant="warning"
              title="Complete Your Profile"
              dismissible
              onDismiss={() => setShowCompletionBanner(false)}
              className="mb-10 border border-amber-200/70 shadow-glow-amber"
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
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <StatGrid columns={2} className="mb-12">
            <StatCard
              title="Total Bookings"
              value={stats.bookings}
              subtitle={stats.bookings === 0 ? 'No bookings yet' : 'All time bookings'}
              icon={<Calendar className="h-4 w-4" />}
              onClick={() => router.push('/dashboard/bookings')}
              className="relative overflow-hidden"
            />
            <StatCard
              title="Upcoming"
              value={stats.upcomingBookings}
              subtitle={stats.upcomingBookings === 0 ? 'No upcoming dinners' : 'Confirmed dinners'}
              icon={<Utensils className="h-4 w-4" />}
              onClick={() => router.push('/dashboard/bookings')}
              className="relative overflow-hidden"
            />
          </StatGrid>
        </motion.div>

        {/* Featured Actions */}
        <Section title="Get Started" spacing="lg">
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <ActionGrid columns={3}>
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
              <ActionCard
                title="Refresh Profile"
                description="Retune your bio and tags for better matches"
                icon={<User className="h-6 w-6" />}
                variant="accent"
                onClick={handleOpenWizard}
              />
            </ActionGrid>
            <motion.div
              className="pointer-events-none absolute -right-8 -bottom-10 h-36 w-36 rounded-full bg-gradient-to-br from-coral-500/20 via-amber-400/20 to-accent-500/14 blur-3xl"
              animate={{ scale: [1, 1.05, 1], opacity: [0.18, 0.28, 0.18] }}
              transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror' }}
            />
          </motion.div>
        </Section>

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-20px' }}
            transition={{ staggerChildren: 0.06 }}
            className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4"
          >
            {[
              {
                label: 'My Bookings',
                icon: <Calendar className="h-5 w-5" />,
                variant: 'info' as const,
                badge: stats.upcomingBookings > 0 ? `${stats.upcomingBookings} upcoming` : undefined,
                onClick: () => router.push('/dashboard/bookings'),
              },
              {
                label: 'Messages',
                icon: <MessageSquare className="h-5 w-5" />,
                variant: 'secondary' as const,
                onClick: () => router.push('/dashboard/messages'),
              },
              {
                label: 'Profile',
                icon: <User className="h-5 w-5" />,
                variant: 'default' as const,
                onClick: () => router.push('/dashboard/profile'),
              },
              {
                label: 'Become Host',
                icon: <ChefHat className="h-5 w-5" />,
                variant: 'warning' as const,
                onClick: () => router.push('/dashboard/host/apply'),
              },
            ].map((action, idx) => (
              <motion.div
                key={action.label}
                variants={{
                  hidden: { opacity: 0, y: 10, scale: 0.98 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.35, ease: 'easeOut', delay: idx * 0.04 },
                  },
                }}
              >
                <QuickAction {...action} />
              </motion.div>
            ))}
          </motion.div>
        </Section>
      </Container>

      <OnboardingFlowDialog
        isOpen={showOnboardingFlow}
        completion={profileCompletion}
        bookingsCount={stats.bookings}
        hasCompletedGuestTour={profile?.hasCompletedGuestTour}
        onOpenWizard={handleOpenWizard}
        onStartTour={handleStartTour}
        onBookDinner={handleBookDinner}
        onClose={handleCloseOnboardingFlow}
        onFinish={handleFinishOnboardingFlow}
      />

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
