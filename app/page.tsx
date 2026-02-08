'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import InteractiveFloatingIcons from '@/components/InteractiveFloatingIcons'
import DynamicSlogan from '@/components/ui/DynamicSlogan'
import { useInteraction, requestGyroscopePermission } from '@/hooks/useInteraction'
import {
  ArrowRight,
  Calendar,
  Heart,
  Home as HomeIcon,
  ShieldCheck,
  Eye,
  Lock,
  MessageCircle,
  Star,
  UtensilsCrossed,
  Sparkles,
  Users,
  ChefHat,
} from 'lucide-react'

export default function Home() {
  const interaction = useInteraction()
  const [gyroRequested, setGyroRequested] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 50])

  const handleFirstInteraction = useCallback(async () => {
    if (!gyroRequested && interaction.isMobile && interaction.hasGyroscope) {
      const granted = await requestGyroscopePermission()
      setGyroRequested(true)
      if (granted) {
        console.log('Gyroscope permission granted')
      }
    }
  }, [gyroRequested, interaction.isMobile, interaction.hasGyroscope])

  return (
    <div
      className="relative overflow-hidden"
      onClick={handleFirstInteraction}
      onTouchStart={handleFirstInteraction}
    >
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[var(--background)] pt-16 pb-8 sm:pt-0 sm:pb-0"
      >
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-coral-50 via-surface-50 to-accent-50 dark:from-void dark:via-space dark:to-nebula" />

          {/* Organic blob shapes - smaller on mobile */}
          <motion.div
            className="absolute top-[10%] left-0 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-coral-300/30 to-coral-500/15 dark:from-neon-coral/10 dark:to-neon-coral/5 rounded-full blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[15%] right-0 w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-accent-300/25 to-accent-500/10 dark:from-neon-teal/10 dark:to-neon-teal/5 rounded-full blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>

        {/* Interactive floating food icons - hidden on small mobile */}
        <div className="hidden sm:block">
          <InteractiveFloatingIcons />
        </div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-6 lg:px-8"
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left column - Text content */}
            <div className="text-center lg:text-left">
              {/* Status pill */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium text-xs sm:text-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-coral-500" />
                  </span>
                  <span className="font-medium text-[var(--foreground-secondary)]">
                    <DynamicSlogan />
                  </span>
                </span>
              </motion.div>

              {/* Main headline - responsive sizes */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-6 sm:mt-8"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                  <span className="block text-[var(--foreground)]">Where</span>
                  <span className="block text-coral-500 dark:text-neon-coral">strangers</span>
                  <span className="block text-[var(--foreground)]">become</span>
                  <span className="block text-gradient-animated">dinner guests</span>
                </h1>
              </motion.div>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-5 sm:mt-6 text-base sm:text-lg text-[var(--foreground-secondary)] max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Intimate dinners hosted by passionate home chefs.
                <span className="text-coral-600 dark:text-neon-coral font-medium"> No restaurants, no pretense—</span>
                just real food and real connections.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:justify-start justify-center"
              >
                <Button
                  size="lg"
                  className="group w-full sm:w-auto !text-base sm:!text-lg !px-6 sm:!px-8 !py-4 sm:!py-5 !h-auto !font-semibold !rounded-xl sm:!rounded-2xl"
                  href="/dinners"
                >
                  Find Your Table
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto !text-base sm:!text-lg !px-6 sm:!px-8 !py-4 sm:!py-5 !h-auto !font-semibold !rounded-xl sm:!rounded-2xl"
                  href="/dashboard/host/apply"
                >
                  Become a Host
                </Button>
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="mt-8 sm:mt-10 flex items-center gap-4 justify-center lg:justify-start"
              >
                <div className="flex -space-x-2 sm:-space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[var(--background)] bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center text-white text-xs"
                      style={{ zIndex: 6 - i }}
                    >
                      {['🍝', '🍣', '🥘', '🍜', '🥗'][i - 1]}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[var(--foreground)]">10,000+ happy diners</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-xs text-[var(--foreground-secondary)] ml-1">4.9/5</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right column - Featured visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <div className="relative glass-premium rounded-3xl p-6 card-lift">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-coral-100 to-coral-200 dark:from-coral-900/30 dark:to-coral-800/20 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-8xl mb-4">🍽️</div>
                        <p className="text-lg font-sans font-semibold text-coral-700 dark:text-coral-300">Tonight's Feature</p>
                        <p className="text-sm text-coral-600/70 dark:text-coral-400/70 mt-1">Homemade Pasta Night</p>
                      </div>
                    </div>
                  </div>

                  {/* Host info */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold">
                      MC
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">Chef Marco</p>
                      <p className="text-sm text-[var(--foreground-secondary)]">Italian Cuisine • Milan</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">4.9</span>
                    </div>
                  </div>
                </div>

                {/* Floating notification cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="absolute -top-6 -right-6 glass-premium rounded-2xl p-4 shadow-xl float-gentle"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">It's a Match!</p>
                      <p className="text-xs text-[var(--foreground-secondary)]">Sarah liked you back</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  className="absolute -bottom-4 -left-8 glass-premium rounded-2xl p-4 shadow-xl float-gentle stagger-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-coral-100 dark:bg-coral-900/30 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-coral-600 dark:text-coral-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">Booking Confirmed</p>
                      <p className="text-xs text-[var(--foreground-secondary)]">Tomorrow at 7 PM</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator - hidden on mobile */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-xs uppercase tracking-widest text-[var(--foreground-muted)]">
              Scroll
            </span>
            <div className="w-5 h-8 rounded-full border-2 border-[var(--foreground-muted)]/30 flex justify-center pt-1.5">
              <motion.div
                className="w-1 h-1 rounded-full bg-coral-500"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works - Modern Editorial */}
      <HowItWorks />

      {/* Features Section */}
      <FeaturesSection />

      {/* Social Proof / Stats */}
      <StatsSection />

      {/* Final CTA */}
      <CTASection />
    </div>
  )
}

// How It Works Section
function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const steps = [
    {
      number: '01',
      title: 'Discover',
      subtitle: 'Find your perfect host',
      description: 'Swipe through passionate home chefs. Match based on cuisine preferences, dietary needs, and vibe.',
      icon: <Heart className="h-6 w-6" />,
      color: 'coral',
    },
    {
      number: '02',
      title: 'Book',
      subtitle: 'Reserve your seat',
      description: 'Pick a dinner, choose your add-ons, and secure your spot. Simple, transparent pricing.',
      icon: <Calendar className="h-6 w-6" />,
      color: 'accent',
    },
    {
      number: '03',
      title: 'Dine',
      subtitle: 'Feast & connect',
      description: 'Show up hungry, leave happy. Enjoy home-cooked meals and make lasting connections.',
      icon: <UtensilsCrossed className="h-6 w-6" />,
      color: 'amber',
    },
  ]

  return (
    <section ref={ref} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 lg:px-8 bg-[var(--background-secondary)] relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16 lg:mb-20"
        >
          <span className="inline-block px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-coral-100 dark:bg-coral-900/30 text-coral-700 dark:text-coral-300 mb-4 sm:mb-6">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-sans font-bold text-[var(--foreground)] tracking-tight">
            From kitchen to table
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto px-2">
            Three simple steps to your next unforgettable dining experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-12">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
            >
              <Card
                hover="glow"
                className="relative p-5 sm:p-6 lg:p-8 h-full border-0 bg-[var(--background-elevated)] shadow-refined-lg card-lift group"
              >
                {/* Step number watermark */}
                <span className="absolute top-4 sm:top-6 right-4 sm:right-6 text-5xl sm:text-6xl lg:text-7xl font-sans font-bold text-[var(--border)] group-hover:text-coral-500/10 transition-colors">
                  {step.number}
                </span>

                <CardContent className="p-0 relative">
                  {/* Icon */}
                  <div className={`
                    h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6
                    ${step.color === 'coral' ? 'bg-coral-100 dark:bg-coral-900/30 text-coral-600 dark:text-coral-400' : ''}
                    ${step.color === 'accent' ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' : ''}
                    ${step.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : ''}
                  `}>
                    {step.icon}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-sans font-bold text-[var(--foreground)] mb-1.5 sm:mb-2">
                    {step.title}
                  </h3>
                  <p className="text-coral-600 dark:text-coral-400 font-medium text-xs sm:text-sm mb-3 sm:mb-4">
                    {step.subtitle}
                  </p>
                  <p className="text-sm sm:text-base text-[var(--foreground-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Features Section
function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const features = [
    {
      title: 'Home-Cooked Magic',
      description: 'Taste the difference of meals made with love—not in commercial kitchens, but in cozy homes.',
      icon: <HomeIcon className="h-5 w-5" />,
    },
    {
      title: 'Vetted Hosts',
      description: 'Every chef is carefully reviewed for culinary skills and hospitality excellence.',
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      title: 'Honest Pricing',
      description: 'See exactly what you pay for. No hidden fees, just transparent, fair costs.',
      icon: <Eye className="h-5 w-5" />,
    },
    {
      title: 'Secure Payments',
      description: 'Book with confidence. Your payment is protected every step of the way.',
      icon: <Lock className="h-5 w-5" />,
    },
    {
      title: 'Direct Chat',
      description: 'Message hosts about dietary needs, allergies, or special requests directly.',
      icon: <MessageCircle className="h-5 w-5" />,
    },
    {
      title: 'Real Reviews',
      description: 'Authentic feedback from diners who have sat at the same table before you.',
      icon: <Star className="h-5 w-5" />,
    },
  ]

  return (
    <section ref={ref} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Gradient orbs - smaller on mobile */}
      <div className="absolute top-1/2 left-0 w-40 sm:w-64 h-40 sm:h-64 bg-coral-500/10 dark:bg-neon-coral/5 rounded-full blur-[80px] sm:blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-32 sm:w-48 h-32 sm:h-48 bg-accent-500/10 dark:bg-neon-teal/5 rounded-full blur-[60px] sm:blur-[80px]" />

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16 lg:mb-20"
        >
          <span className="inline-block px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 mb-4 sm:mb-6">
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-sans font-bold text-[var(--foreground)] tracking-tight">
            Built for food lovers
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto px-2">
            Everything you need for authentic dining experiences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
            >
              <div className="group p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border)] hover:border-coral-500/30 bg-[var(--background-elevated)] hover:shadow-lg transition-all duration-300 h-full">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-coral-500/10 to-accent-500/10 flex items-center justify-center text-coral-600 dark:text-coral-400 group-hover:scale-110 transition-transform mb-3 sm:mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-lg font-sans font-semibold text-[var(--foreground)] mb-1.5 sm:mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Stats Section
function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const stats = [
    { value: '10k+', label: 'Happy Diners', icon: <Users className="h-6 w-6" /> },
    { value: '500+', label: 'Dinners Hosted', icon: <UtensilsCrossed className="h-6 w-6" /> },
    { value: '150+', label: 'Passionate Hosts', icon: <ChefHat className="h-6 w-6" /> },
    { value: '4.9', label: 'Average Rating', icon: <Star className="h-6 w-6" /> },
  ]

  return (
    <section ref={ref} className="py-14 sm:py-20 lg:py-24 px-5 sm:px-6 lg:px-8 bg-gradient-to-br from-coral-500 via-coral-600 to-coral-700 dark:from-coral-900 dark:via-coral-800 dark:to-coral-900 relative overflow-hidden">
      {/* Pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm text-white mb-3 sm:mb-4">
                <span className="[&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6">{stat.icon}</span>
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold text-white mb-1 sm:mb-2">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm lg:text-base text-coral-100 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 lg:px-8 bg-[var(--background-secondary)] relative overflow-hidden">
      {/* Background elements - smaller on mobile */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-40 sm:w-64 h-40 sm:h-64 bg-coral-500/10 rounded-full blur-[80px] sm:blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-40 sm:w-64 h-40 sm:h-64 bg-accent-500/10 rounded-full blur-[80px] sm:blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="relative max-w-4xl mx-auto text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-coral-100 dark:bg-coral-900/30 text-coral-700 dark:text-coral-300 text-xs sm:text-sm font-medium mb-5 sm:mb-8">
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Ready to dine differently?
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-sans font-bold text-[var(--foreground)] tracking-tight">
          Your next great meal
          <br />
          <span className="italic text-coral-500 dark:text-neon-coral">is waiting</span>
        </h2>

        <p className="mt-5 sm:mt-8 text-base sm:text-lg lg:text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto px-2">
          Join thousands discovering authentic home-cooked meals.
          Or share your passion and become a host.
        </p>

        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <Button
            size="lg"
            className="group w-full sm:w-auto !text-base sm:!text-lg !px-6 sm:!px-10 !py-4 sm:!py-7 !h-auto !font-semibold !rounded-xl sm:!rounded-2xl"
            href="/dinners"
          >
            Explore Dinners
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto !text-base sm:!text-lg !px-6 sm:!px-10 !py-4 sm:!py-7 !h-auto !font-semibold !rounded-xl sm:!rounded-2xl"
            href="/dashboard/host/apply"
          >
            Apply to Host
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
