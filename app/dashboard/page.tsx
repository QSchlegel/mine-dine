'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Utensils, Calendar, MessageSquare, User, Heart, ChefHat, Sparkles, ArrowRight, TrendingUp, Clock, PartyPopper } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

  // Get time-appropriate food emoji
  const getMealEmoji = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '☕'
    if (hour < 18) return '🍽️'
    return '🌙'
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[var(--background)] py-8 sm:py-12 overflow-hidden">
        {/* Animated background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-coral-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-accent-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <Container className="relative">
          <PageHeaderSkeleton size="lg" />

          <StatGrid columns={2} className="mb-12">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </StatGrid>

          <Section title="Get Started" spacing="lg">
            <ActionGrid>
              <ActionCardSkeleton variant="gradient" />
              <ActionCardSkeleton variant="gradient" />
            </ActionGrid>
          </Section>

          <Section title="Quick Actions">
            <QuickActionGridSkeleton count={4} columns={4} />
          </Section>
        </Container>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[var(--background)] py-8 sm:py-12 overflow-hidden">
      {/* Animated background blobs - smaller on mobile */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute top-[5%] left-[5%] w-[280px] sm:w-[400px] lg:w-[500px] h-[280px] sm:h-[400px] lg:h-[500px] bg-gradient-to-br from-coral-400/15 to-coral-600/5 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px]"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[5%] w-[250px] sm:w-[350px] lg:w-[450px] h-[250px] sm:h-[350px] lg:h-[450px] bg-gradient-to-br from-accent-400/12 to-accent-600/5 rounded-full blur-[70px] sm:blur-[85px] lg:blur-[100px]"
          animate={{
            x: [0, -25, 0],
            y: [0, 25, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
        />
        <motion.div
          className="absolute top-[40%] right-[20%] w-[200px] sm:w-[250px] lg:w-[300px] h-[200px] sm:h-[250px] lg:h-[300px] bg-gradient-to-br from-amber-400/10 to-amber-600/5 rounded-full blur-[60px] sm:blur-[70px] lg:blur-[80px] hidden sm:block"
          animate={{
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 6,
          }}
        />
      </div>

      <Container className="relative">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6 mb-6 sm:mb-10">
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-coral-100 dark:bg-coral-900/30 text-coral-700 dark:text-coral-300 text-xs sm:text-sm font-medium mb-3 sm:mb-4"
              >
                <span className="text-base sm:text-lg">{getMealEmoji()}</span>
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </motion.div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-sans font-bold text-[var(--foreground)] tracking-tight leading-[1.1]">
                {getGreeting()}
                {userName && (
                  <>
                    ,<br />
                    <span className="text-coral-500 dark:text-neon-coral">{userName.split(' ')[0]}</span>
                  </>
                )}
              </h1>

              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[var(--foreground-secondary)] max-w-lg">
                {stats.upcomingBookings > 0
                  ? `You have ${stats.upcomingBookings} upcoming dinner${stats.upcomingBookings > 1 ? 's' : ''} to look forward to.`
                  : 'Ready to discover your next memorable dining experience?'}
              </p>
            </div>

            {/* Quick stats cards */}
            <div className="flex gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-premium rounded-xl sm:rounded-2xl p-4 sm:p-5 flex-1 sm:flex-none sm:min-w-[140px]"
              >
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-coral-100 dark:bg-coral-900/30 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-coral-600 dark:text-coral-400" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-sans font-bold text-[var(--foreground)]">{stats.bookings}</p>
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">Total bookings</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-premium rounded-xl sm:rounded-2xl p-4 sm:p-5 flex-1 sm:flex-none sm:min-w-[140px]"
              >
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-600 dark:text-accent-400" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-sans font-bold text-[var(--foreground)]">{stats.upcomingBookings}</p>
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">Upcoming</p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Status Pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-6 sm:mb-10"
        >
          {[
            {
              label: 'Momentum',
              value: stats.bookings === 0 ? 'First dinner awaits' : `${stats.bookings} experience${stats.bookings === 1 ? '' : 's'}`,
              icon: '🚀',
              color: 'coral',
            },
            {
              label: 'Profile',
              value: profileCompletion?.isComplete ? 'Looking great!' : `${profileCompletion?.progress ?? 0}% complete`,
              icon: profileCompletion?.isComplete ? '✨' : '📝',
              color: 'accent',
            },
            {
              label: 'Next step',
              value: profile?.bio ? 'Find new hosts' : 'Add a bio',
              icon: profile?.bio ? '👀' : '💭',
              color: 'amber',
            },
          ].map((pill, idx) => (
            <motion.div
              key={pill.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.08 }}
              className={`
                relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all duration-300 cursor-default
                ${pill.color === 'coral' ? 'border-coral-200/50 dark:border-coral-800/30 bg-gradient-to-br from-coral-50 to-white dark:from-coral-900/20 dark:to-transparent hover:border-coral-300 dark:hover:border-coral-700/50' : ''}
                ${pill.color === 'accent' ? 'border-accent-200/50 dark:border-accent-800/30 bg-gradient-to-br from-accent-50 to-white dark:from-accent-900/20 dark:to-transparent hover:border-accent-300 dark:hover:border-accent-700/50' : ''}
                ${pill.color === 'amber' ? 'border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-transparent hover:border-amber-300 dark:hover:border-amber-700/50' : ''}
              `}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-xl sm:text-2xl">{pill.icon}</span>
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--foreground-muted)] font-medium">{pill.label}</p>
                  <p className="text-xs sm:text-sm font-semibold text-[var(--foreground)]">{pill.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Onboarding Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
        >
          <OnboardingChecklist
            completion={profileCompletion}
            bookingsCount={stats.bookings}
            hasCompletedGuestTour={profile?.hasCompletedGuestTour}
            onOpenWizard={handleOpenWizard}
            onStartTour={handleStartTour}
            onBookDinner={handleBookDinner}
            onStartGuidedFlow={() => setShowOnboardingFlow(true)}
            className="mb-10"
          />
        </motion.div>

        {/* Profile Completion Banner */}
        <AnimatePresence>
          {profileCompletion && !profileCompletion.isComplete && showCompletionBanner && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-10"
            >
              <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 dark:border-amber-700/30 bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-900/20 dark:via-transparent dark:to-amber-900/20 p-6">
                <button
                  onClick={() => setShowCompletionBanner(false)}
                  className="absolute top-4 right-4 p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-amber-200 dark:text-amber-800"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${(profileCompletion.progress / 100) * 176} 176`}
                          className="text-amber-500 dark:text-amber-400"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-amber-700 dark:text-amber-300">
                        {profileCompletion.progress}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-sans font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Complete your profile
                    </h3>
                    <p className="text-sm text-amber-700/80 dark:text-amber-300/80 mb-3">
                      A complete profile helps you get better matches and more dinner invites.
                    </p>
                    {profileCompletion.recommendations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profileCompletion.recommendations.slice(0, 2).map((rec, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300"
                          >
                            {rec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleOpenWizard}
                    className="flex-shrink-0 !bg-amber-600 hover:!bg-amber-700 dark:!bg-amber-500 dark:hover:!bg-amber-400"
                  >
                    Complete Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-sans font-bold text-[var(--foreground)]">
              Get Started
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Primary action - Discover */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-coral-500 to-coral-600 dark:from-coral-600 dark:to-coral-700 p-5 sm:p-6 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-coral-500/20 transition-shadow"
              onClick={() => router.push('/dashboard/swipe')}
            >
              <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />

              <div className="relative">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-sans font-bold text-white mb-1.5 sm:mb-2">Discover Hosts</h3>
                <p className="text-coral-100 text-xs sm:text-sm mb-4 sm:mb-6">Swipe to find your perfect dining match</p>
                <div className="flex items-center text-white text-sm sm:text-base font-medium">
                  Start Swiping
                  <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>

            {/* Secondary action - Browse */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-700 p-5 sm:p-6 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-accent-500/20 transition-shadow"
              onClick={() => router.push('/dinners')}
            >
              <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />

              <div className="relative">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <Utensils className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-sans font-bold text-white mb-1.5 sm:mb-2">Browse Dinners</h3>
                <p className="text-accent-100 text-xs sm:text-sm mb-4 sm:mb-6">Explore unique dining experiences near you</p>
                <div className="flex items-center text-white text-sm sm:text-base font-medium">
                  View All
                  <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>

            {/* Tertiary action - Profile */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-[var(--border)] bg-[var(--background-elevated)] p-5 sm:p-6 cursor-pointer hover:border-coral-300 dark:hover:border-coral-700 hover:shadow-lg transition-all sm:col-span-2 lg:col-span-1"
              onClick={handleOpenWizard}
            >
              <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-coral-500/5 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />

              <div className="relative">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-coral-100 to-accent-100 dark:from-coral-900/30 dark:to-accent-900/30 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                  <User className="h-6 w-6 sm:h-7 sm:w-7 text-coral-600 dark:text-coral-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-sans font-bold text-[var(--foreground)] mb-1.5 sm:mb-2">Update Profile</h3>
                <p className="text-[var(--foreground-secondary)] text-xs sm:text-sm mb-4 sm:mb-6">Refine your bio for better matches</p>
                <div className="flex items-center text-coral-600 dark:text-coral-400 text-sm sm:text-base font-medium">
                  Edit Now
                  <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-sans font-bold text-[var(--foreground)]">
              Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            {[
              {
                label: 'My Bookings',
                icon: <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />,
                badge: stats.upcomingBookings > 0 ? stats.upcomingBookings : undefined,
                color: 'coral',
                onClick: () => router.push('/dashboard/bookings'),
              },
              {
                label: 'My Events',
                icon: <PartyPopper className="h-4 w-4 sm:h-5 sm:w-5" />,
                color: 'green',
                onClick: () => router.push('/dashboard/events'),
              },
              {
                label: 'Messages',
                icon: <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />,
                color: 'accent',
                onClick: () => router.push('/dashboard/messages'),
              },
              {
                label: 'Profile',
                icon: <User className="h-4 w-4 sm:h-5 sm:w-5" />,
                color: 'amber',
                onClick: () => router.push('/dashboard/profile'),
              },
              {
                label: 'Become Host',
                icon: <ChefHat className="h-4 w-4 sm:h-5 sm:w-5" />,
                color: 'purple',
                onClick: () => router.push('/dashboard/host/apply'),
              },
            ].map((action, idx) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.onClick}
                className={`
                  relative group p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 text-left
                  border-[var(--border)] bg-[var(--background-elevated)]
                  hover:border-${action.color}-300 dark:hover:border-${action.color}-700
                  hover:shadow-md
                `}
              >
                {action.badge && (
                  <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full bg-coral-500 text-white text-[10px] sm:text-xs font-bold shadow-lg">
                    {action.badge}
                  </span>
                )}
                <div className={`
                  h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl flex items-center justify-center mb-2.5 sm:mb-3 transition-transform group-hover:scale-110
                  ${action.color === 'coral' ? 'bg-coral-100 dark:bg-coral-900/30 text-coral-600 dark:text-coral-400' : ''}
                  ${action.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : ''}
                  ${action.color === 'accent' ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' : ''}
                  ${action.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : ''}
                  ${action.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : ''}
                `}>
                  {action.icon}
                </div>
                <p className="font-sans text-sm sm:text-base font-semibold text-[var(--foreground)]">{action.label}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
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
