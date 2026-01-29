'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations'
import InteractiveFloatingIcons from '@/components/InteractiveFloatingIcons'
import CustomCursor from '@/components/CustomCursor'
import DynamicSlogan from '@/components/ui/DynamicSlogan'
import { useInteraction, requestGyroscopePermission } from '@/hooks/useInteraction'
import {
  ChevronDown,
  Calendar,
  Heart,
  Home as HomeIcon,
  ShieldCheck,
  Eye,
  Lock,
  MessageCircle,
  Star,
  UtensilsCrossed,
} from 'lucide-react'

export default function Home() {
  const interaction = useInteraction()
  const [gyroRequested, setGyroRequested] = useState(false)

  // Request gyroscope permission on first interaction (required for iOS)
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
      {/* Custom cursor (desktop only) */}
      <CustomCursor enabled={!interaction.isMobile} />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[var(--background)]">
        {/* Background layer - adapts to theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-purple-50/30 to-cyan-50/50 dark:from-transparent dark:via-transparent dark:to-transparent" />
        <div className="absolute inset-0 grid-pattern opacity-30 dark:opacity-0" />
        <div className="absolute inset-0 dark:matrix-grid" />

        {/* Gradient orbs - theme adaptive */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-pink-400/30 dark:bg-neon-coral/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-400/30 dark:bg-neon-teal/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-400/20 dark:bg-neon-amber/5 rounded-full blur-[150px]" />

        {/* Neon accent line for dark mode */}
        <div className="absolute top-0 left-0 right-0 h-px opacity-0 dark:opacity-100 bg-gradient-to-r from-transparent via-neon-teal/40 to-transparent" />

        {/* Interactive floating food icons with parallax */}
        <InteractiveFloatingIcons />

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div variants={staggerItem}>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 dark:from-neon-teal/10 dark:to-neon-coral/10 border border-pink-300/50 dark:border-neon-teal/30 text-pink-700 dark:text-neon-teal text-sm font-semibold shadow-sm dark:font-mono">
                <span className="h-2 w-2 rounded-full bg-pink-500 dark:bg-neon-teal animate-pulse" />
                <DynamicSlogan />
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={staggerItem}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-tight"
            >
              <span className="block text-[var(--foreground)]">Savor Every</span>
              <span className="block mt-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 dark:from-neon-coral dark:via-neon-teal dark:to-neon-amber bg-clip-text text-transparent">
                Bite, Share Every
              </span>
              <span className="block mt-2 text-[var(--foreground)]">Moment</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={staggerItem}
              className="max-w-2xl mx-auto text-lg sm:text-xl text-[var(--foreground-secondary)] leading-relaxed dark:font-light"
            >
              Experience authentic home-cooked meals from passionate chefs.
              <span className="text-pink-600 dark:text-neon-coral font-medium"> No reservations needed, just real food and real connections.</span>
            </motion.p>

            {/* Main CTA Button */}
            <motion.div
              variants={staggerItem}
              className="flex justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                {/* Animated glow ring behind button for dark mode */}
                <div className="absolute -inset-1 opacity-0 dark:opacity-50 bg-gradient-to-r from-neon-coral via-neon-teal to-neon-amber rounded-xl blur-lg animate-cyber-pulse" />
                <Button
                  size="lg"
                  className="!text-xl sm:!text-2xl !px-10 sm:!px-14 !py-6 sm:!py-8 !h-auto !font-bold !shadow-2xl hover:!shadow-glow-coral dark:!bg-neon-coral dark:!text-void dark:hover:!bg-neon-coral-bright dark:!shadow-neon-coral-lg dark:hover:!shadow-[0_0_40px_theme(colors.neon.coral/0.6),0_0_80px_theme(colors.neon.coral/0.4)] relative z-10 dark:!border-neon-coral/50"
                  href="/dinners"
                >
                  <span className="dark:font-mono dark:tracking-wider">Ready to Dine!</span>
                </Button>
              </motion.div>
            </motion.div>

            {/* Secondary CTA Buttons */}
            <motion.div
              variants={staggerItem}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto dark:!border-neon-teal/50 dark:!text-neon-teal dark:hover:!bg-neon-teal/10 dark:hover:!border-neon-teal dark:hover:!shadow-neon-teal dark:!font-mono" href="/dinners">
                Browse Dinners
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto dark:!border-neon-amber/50 dark:!text-neon-amber dark:hover:!bg-neon-amber/10 dark:hover:!border-neon-amber dark:hover:!shadow-neon-amber dark:!font-mono" href="/host/apply">
                Become a Host
              </Button>
            </motion.div>

            {/* Stats - Terminal data display in dark mode */}
            <motion.div
              variants={staggerItem}
              className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 pt-12"
            >
              <Stat value="500+" label="Delicious Meals" icon="🍲" />
              <Stat value="150+" label="Passionate Chefs" icon="👨‍🍳" />
              <Stat value="10k+" label="Satisfied Diners" icon="😋" />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2 text-[var(--foreground-muted)]"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-xs uppercase tracking-wider dark:font-mono dark:tracking-[0.2em]">Scroll</span>
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--background-secondary)] relative overflow-hidden">
        {/* Subtle grid for dark mode */}
        <div className="absolute inset-0 opacity-0 dark:opacity-50 dark:matrix-grid-dense" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] dark:font-mono dark:tracking-wide">
              From Kitchen to Table
            </h2>
            <p className="mt-4 text-lg text-[var(--foreground-secondary)] dark:font-light">
              Three simple steps to your next unforgettable meal
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            <StepCard
              number="01"
              title="Explore Menus"
              description="Browse mouth-watering dishes from passionate home chefs. From Italian pasta to Asian fusion, find your perfect meal."
              icon={<UtensilsCrossed className="h-6 w-6" />}
            />
            <StepCard
              number="02"
              title="Reserve Your Seat"
              description="Book your spot at the table, customize your meal with add-ons, and secure your place with easy payment."
              icon={<Calendar className="h-6 w-6" />}
            />
            <StepCard
              number="03"
              title="Feast & Connect"
              description="Arrive hungry, leave happy. Enjoy authentic home-cooked meals and meaningful conversations with your host and fellow diners."
              icon={<Heart className="h-6 w-6" />}
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient glow orbs for dark mode */}
        <div className="absolute top-1/2 left-0 w-64 h-64 opacity-0 dark:opacity-100 bg-neon-teal/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 opacity-0 dark:opacity-100 bg-neon-coral/5 rounded-full blur-[80px]" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] dark:font-mono dark:tracking-wide">
              Why Food Lovers Choose Us
            </h2>
            <p className="mt-4 text-lg text-[var(--foreground-secondary)] dark:font-light">
              Real food, real people, real experiences
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <FeatureCard
              title="Home-Cooked Perfection"
              description="Taste the difference of meals made with love in cozy home kitchens, not commercial kitchens."
              icon={<HomeIcon className="h-5 w-5" />}
            />
            <FeatureCard
              title="Chef-Vetted Hosts"
              description="Every host is carefully selected and reviewed to ensure exceptional culinary skills and hospitality."
              icon={<ShieldCheck className="h-5 w-5" />}
            />
            <FeatureCard
              title="Honest Pricing"
              description="See exactly what you're paying for - from ingredients to the chef's time. No hidden fees, just transparent costs."
              icon={<Eye className="h-5 w-5" />}
            />
            <FeatureCard
              title="Secure & Simple"
              description="Book and pay with confidence through our secure platform. Your payment is protected every step of the way."
              icon={<Lock className="h-5 w-5" />}
            />
            <FeatureCard
              title="Personal Touch"
              description="Chat directly with hosts about dietary restrictions, allergies, or special requests. They're here to make it perfect for you."
              icon={<MessageCircle className="h-5 w-5" />}
            />
            <FeatureCard
              title="Real Reviews"
              description="Read authentic reviews from diners who've sat at the same table. Know what to expect before you book."
              icon={<Star className="h-5 w-5" />}
            />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--background-secondary)] relative overflow-hidden">
        {/* Background accents */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent dark:from-void dark:via-space dark:to-void" />
        <div className="absolute inset-0 opacity-0 dark:opacity-30 dark:matrix-grid" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-pink-500/10 dark:bg-neon-coral/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent-500/10 dark:bg-neon-teal/10 rounded-full blur-[80px]" />

        {/* Horizontal neon line accent for dark mode */}
        <div className="absolute top-0 left-0 right-0 h-px opacity-0 dark:opacity-100 bg-gradient-to-r from-transparent via-neon-teal/40 to-transparent" />

        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] dark:font-mono dark:tracking-wide">
            Hungry for Something Real?
          </h2>
          <p className="mt-4 text-lg text-[var(--foreground-secondary)] dark:font-light">
            Join thousands of food lovers discovering authentic home-cooked meals.
            Or share your passion for cooking and become a host.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" href="/dinners" className="dark:!bg-neon-coral dark:!text-void dark:hover:!bg-neon-coral-bright dark:!shadow-neon-coral dark:hover:!shadow-neon-coral-lg dark:!font-mono">
              Find a Dinner
            </Button>
            <Button variant="secondary" size="lg" href="/host/apply" className="dark:!bg-neon-amber/20 dark:!text-neon-amber dark:!border-neon-amber/50 dark:hover:!bg-neon-amber/30 dark:hover:!shadow-neon-amber dark:!font-mono">
              Apply to Host
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

// Stat component
function Stat({ value, label, icon }: { value: string; label: string; icon?: string }) {
  return (
    <div className="text-center group">
      <div className="flex items-center justify-center gap-2">
        {icon && <span className="text-2xl sm:text-3xl dark:grayscale dark:opacity-70 group-hover:dark:grayscale-0 group-hover:dark:opacity-100 transition-all">{icon}</span>}
        <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 dark:from-neon-coral dark:to-neon-teal bg-clip-text text-transparent dark:font-mono dark:tracking-wide">{value}</div>
      </div>
      <div className="text-sm text-[var(--foreground-muted)] mt-1 dark:font-mono dark:tracking-wider dark:uppercase dark:text-xs">{label}</div>
    </div>
  )
}

// Step card component
function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <motion.div variants={staggerItem}>
      <Card hover="glow" className="relative p-6 h-full dark:!bg-space/80 dark:!border-neon-teal/20 dark:hover:!border-neon-teal/40 dark:hover:!shadow-neon-teal">
        <div className="absolute top-4 right-4 text-5xl font-bold text-pink-500/10 dark:text-neon-teal/20 dark:font-mono">
          {number}
        </div>
        <CardContent className="p-0 space-y-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-neon-coral/10 dark:to-neon-teal/10 dark:border dark:border-neon-teal/30 flex items-center justify-center text-pink-600 dark:text-neon-teal">
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] dark:font-mono dark:tracking-wide">{title}</h3>
          <p className="text-[var(--foreground-secondary)] leading-relaxed dark:font-light">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Feature card component
function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <motion.div variants={staggerItem}>
      <Card hover="subtle" className="p-6 h-full dark:!bg-space/60 dark:!border-neon-teal/15 dark:hover:!border-neon-teal/30 dark:hover:!shadow-[0_0_20px_theme(colors.neon.teal/0.1)]">
        <CardContent className="p-0 space-y-3">
          <div className="h-10 w-10 rounded-lg bg-accent-500/10 dark:bg-neon-teal/10 dark:border dark:border-neon-teal/20 flex items-center justify-center text-accent-500 dark:text-neon-teal">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] dark:font-mono">{title}</h3>
          <p className="text-sm text-[var(--foreground-secondary)] dark:font-light">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
