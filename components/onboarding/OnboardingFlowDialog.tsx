'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressRing'
import type { ProfileCompletionResult } from '@/lib/profile'
import { CalendarRange, CheckCircle2, Compass, PartyPopper, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type FlowStepId = 'welcome' | 'profile' | 'tour' | 'booking'

type FlowStep = {
  id: FlowStepId
  title: string
  description: string
  done: boolean
  actionLabel?: string
  onAction?: () => void
  hint?: string
}

interface OnboardingFlowDialogProps {
  isOpen: boolean
  completion: ProfileCompletionResult | null
  bookingsCount: number
  hasCompletedGuestTour?: boolean
  onOpenWizard: () => void
  onStartTour: () => void
  onBookDinner: () => void
  onClose: () => void
  onFinish: () => void
}

/**
 * Full-screen guided onboarding that walks new users through the first three actions:
 * completing their profile, taking the dashboard tour, and booking a dinner.
 */
export default function OnboardingFlowDialog({
  isOpen,
  completion,
  bookingsCount,
  hasCompletedGuestTour = false,
  onOpenWizard,
  onStartTour,
  onBookDinner,
  onClose,
  onFinish,
}: OnboardingFlowDialogProps) {
  const steps = useMemo<FlowStep[]>(() => ([
    {
      id: 'welcome',
      title: 'Welcome aboard',
      description: 'We’ll guide you through three quick steps to personalize matches and get you to your first dinner.',
      done: false,
      actionLabel: 'Start guided onboarding',
    },
    {
      id: 'profile',
      title: 'Complete your profile',
      description: completion
        ? `${completion.progress}% done — add your name, bio, and at least 3 tags.`
        : 'Add your name, bio, and at least 3 interests so hosts know you.',
      done: Boolean(completion?.isComplete),
      actionLabel: completion?.isComplete ? 'Review profile' : 'Open profile wizard',
      onAction: onOpenWizard,
      hint: 'Profiles with bios and tags get matched 3x faster.',
    },
    {
      id: 'tour',
      title: 'Take a 60-second tour',
      description: 'See where to swipe hosts, check bookings, and message them.',
      done: hasCompletedGuestTour,
      actionLabel: hasCompletedGuestTour ? 'Replay tour' : 'Start tour',
      onAction: onStartTour,
      hint: 'The tour is interactive and can be replayed anytime.',
    },
    {
      id: 'booking',
      title: 'Book your first dinner',
      description: bookingsCount > 0
        ? 'Nice! You already have a booking.'
        : 'Browse upcoming dinners and save your seat.',
      done: bookingsCount > 0,
      actionLabel: bookingsCount > 0 ? 'See dinners' : 'Browse dinners',
      onAction: onBookDinner,
      hint: 'Booking early unlocks better recommendations.',
    },
  ]), [bookingsCount, completion, hasCompletedGuestTour, onBookDinner, onOpenWizard, onStartTour])

  const actionableSteps = steps.filter((step) => step.id !== 'welcome')
  const completedCount = actionableSteps.filter((step) => step.done).length
  const totalSteps = actionableSteps.length
  const progress = Math.round((completedCount / totalSteps) * 100)
  const allDone = completedCount === totalSteps

  const [currentIndex, setCurrentIndex] = useState(0)
  const currentStep = steps[currentIndex]

  // Initialize the flow at the welcome screen, then jump to the first incomplete step
  useEffect(() => {
    if (!isOpen) return
    setCurrentIndex(0)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    // If we are past welcome and current step is done, auto-advance to the next incomplete step
    if (currentStep?.id !== 'welcome' && currentStep?.done) {
      const nextIncomplete = steps.findIndex((step, idx) => idx > currentIndex && !step.done)
      if (nextIncomplete !== -1) {
        setCurrentIndex(nextIncomplete)
      }
    }
  }, [currentIndex, currentStep?.done, currentStep?.id, isOpen, steps])

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      onFinish()
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handlePrimaryNav = () => {
    if (currentIndex === steps.length - 1) {
      onFinish()
      return
    }
    goNext()
  }

  const heroIcon = (stepId: FlowStepId) => {
    switch (stepId) {
      case 'profile':
        return <Compass className="h-5 w-5" />
      case 'tour':
        return <Sparkles className="h-5 w-5" />
      case 'booking':
        return <CalendarRange className="h-5 w-5" />
      default:
        return <PartyPopper className="h-5 w-5" />
    }
  }

  const renderStepBody = () => {
    switch (currentStep.id) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <Badge variant="outline" className="border-coral-200 text-coral-600 dark:border-coral-900/40 dark:text-coral-300">
              New here? Start with these three steps
            </Badge>
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-[var(--foreground)]">Make the most of Mine Dine</h3>
              <p className="text-[var(--foreground-secondary)]">
                Complete your profile, take a 60-second tour, and book your first dinner. We’ll track your progress as you go.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {actionableSteps.map((step) => (
                <div key={step.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/60 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                    {heroIcon(step.id)}
                    {step.title}
                  </div>
                  <p className="text-xs text-[var(--foreground-secondary)] mt-1 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  const nextIndex = steps.findIndex((step) => step.id !== 'welcome')
                  setCurrentIndex(nextIndex === -1 ? 0 : nextIndex)
                }}
                variant="primary"
                className="bg-coral-500 hover:bg-coral-600 text-white"
              >
                Start guided steps
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Skip for now
              </Button>
            </div>
          </div>
        )
      case 'profile':
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default">Step 1 of 3</Badge>
              {completion && (
                <span className="text-xs text-[var(--foreground-secondary)]">{completion.progress}% complete</span>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-[var(--foreground)]">Complete your profile</h3>
              <p className="text-[var(--foreground-secondary)]">
                Add your name, a friendly bio, and at least three interests to unlock better matches.
              </p>
              {completion && (
                <div className="flex items-center gap-3">
                  <ProgressBar value={completion.progress} variant="secondary" className="flex-1" />
                  <Badge variant="outline">{completion.progress}%</Badge>
                </div>
              )}
              {currentStep.hint && (
                <p className="text-xs text-[var(--foreground-muted)]">{currentStep.hint}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={currentStep.onAction}
                variant="primary"
                className="bg-coral-500 hover:bg-coral-600 text-white"
              >
                {currentStep.actionLabel}
              </Button>
              <Button variant="ghost" onClick={handlePrimaryNav}>
                {completion?.isComplete ? 'Next step' : 'Skip for now'}
              </Button>
            </div>
          </div>
        )
      case 'tour':
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default">Step 2 of 3</Badge>
              <span className="text-xs text-[var(--foreground-secondary)]">
                Takes about a minute
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-[var(--foreground)]">Take the quick tour</h3>
              <p className="text-[var(--foreground-secondary)]">
                We’ll highlight swipes, bookings, and messages so you know exactly where everything lives.
              </p>
              {currentStep.hint && (
                <p className="text-xs text-[var(--foreground-muted)]">{currentStep.hint}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  currentStep.onAction?.()
                }}
                variant="outline"
                className="border-coral-200 text-coral-600 hover:border-coral-300 hover:text-coral-700"
              >
                {currentStep.actionLabel}
              </Button>
              <Button variant="ghost" onClick={handlePrimaryNav}>
                {currentStep.done ? 'Next step' : 'Skip for now'}
              </Button>
            </div>
          </div>
        )
      case 'booking':
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default">Step 3 of 3</Badge>
              <Badge variant="outline" className={cn(
                'border-coral-200 text-coral-600',
                'dark:border-coral-900/50 dark:text-coral-300'
              )}>
                {bookingsCount > 0 ? 'Booked' : 'No bookings yet'}
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-[var(--foreground)]">Book your first dinner</h3>
              <p className="text-[var(--foreground-secondary)]">
                Explore upcoming dinners, pick your seat, and we’ll guide you through checkout.
              </p>
              {currentStep.hint && (
                <p className="text-xs text-[var(--foreground-muted)]">{currentStep.hint}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={currentStep.onAction}
                variant="primary"
                className="bg-gradient-to-r from-coral-500 to-orange-400 text-white border-none shadow-md shadow-coral-500/20"
              >
                {currentStep.actionLabel}
              </Button>
              <Button variant="ghost" onClick={handlePrimaryNav}>
                {bookingsCount > 0 ? 'Finish' : 'Skip for now'}
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showCloseButton
      mobileFullscreen
      description="Finish these three actions to unlock better matches and faster bookings."
      title="Guided onboarding"
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/70 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--foreground)]">Progress</p>
              <Badge variant={allDone ? 'success' : 'outline'}>
                {completedCount}/{totalSteps} done
              </Badge>
            </div>
            <div className="mt-3 mb-1">
              <ProgressBar value={progress} variant="secondary" />
            </div>
            <p className="text-xs text-[var(--foreground-muted)]">
              Complete these steps to get personalized matches sooner.
            </p>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => {
              const isActive = idx === currentIndex
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'w-full text-left rounded-xl border px-4 py-3 transition-colors',
                    'flex items-center gap-3',
                    isActive
                      ? 'border-coral-500/40 bg-coral-500/5 text-[var(--foreground)]'
                      : 'border-[var(--border)] hover:border-coral-500/30'
                  )}
                >
                  <div className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center',
                    step.done ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)]'
                  )}>
                    {step.done ? <CheckCircle2 className="h-5 w-5" /> : heroIcon(step.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{step.title}</p>
                    <p className="text-xs text-[var(--foreground-muted)] truncate">{step.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-5 lg:p-6 shadow-lg shadow-black/5 dark:shadow-black/40">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-coral-500/10 px-3 py-1 text-sm font-medium text-coral-600">
                {heroIcon(currentStep.id)}
                {currentStep.id === 'welcome' ? 'Let’s get started' : currentStep.title}
              </div>
              {renderStepBody()}
            </motion.div>
          </AnimatePresence>

          <ModalFooter className="mt-6">
            <div className="flex items-center gap-3 w-full justify-between">
              <Button variant="ghost" onClick={goPrev} disabled={currentIndex === 0}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
                <Button
                  onClick={handlePrimaryNav}
                  variant="primary"
                  className="bg-coral-500 hover:bg-coral-600 text-white"
                >
                  {currentIndex === steps.length - 1 ? (allDone ? 'Finish onboarding' : 'Finish anyway') : 'Next step'}
                </Button>
              </div>
            </div>
          </ModalFooter>
        </div>
      </div>
    </Modal>
  )
}
