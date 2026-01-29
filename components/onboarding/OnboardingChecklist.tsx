'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressRing'
import type { ProfileCompletionResult } from '@/lib/profile'
import { CheckCircle2, Sparkles, Compass, CalendarRange, X } from 'lucide-react'

interface OnboardingChecklistProps {
  completion: ProfileCompletionResult | null
  bookingsCount: number
  hasCompletedGuestTour?: boolean
  onOpenWizard: () => void
  onStartTour: () => void
  onBookDinner?: () => void
  className?: string
}

type ChecklistStep = {
  id: 'profile' | 'tour' | 'booking'
  title: string
  description: string
  done: boolean
  actionLabel: string
  onAction: () => void
}

/**
 * Dashboard onboarding helper showing key first steps and progress.
 */
export default function OnboardingChecklist({
  completion,
  bookingsCount,
  hasCompletedGuestTour = false,
  onOpenWizard,
  onStartTour,
  onBookDinner,
  className,
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const dismissed = typeof window !== 'undefined' && localStorage.getItem('md_onboarding_dismissed') === '1'
    if (dismissed) setIsDismissed(true)
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('md_onboarding_dismissed', '1')
    }
  }

  const steps: ChecklistStep[] = useMemo(() => [
    {
      id: 'profile',
      title: 'Complete your profile',
      description: completion
        ? `${completion.progress}% done · add your name, bio, and at least 3 tags`
        : 'Add your name, bio, and tags to personalize matches',
      done: Boolean(completion?.isComplete),
      actionLabel: completion?.isComplete ? 'View profile' : 'Finish profile',
      onAction: onOpenWizard,
    },
    {
      id: 'tour',
      title: 'Take the interactive tour',
      description: 'See where to find swipes, bookings, and messages in 60 seconds',
      done: hasCompletedGuestTour,
      actionLabel: hasCompletedGuestTour ? 'Replay tour' : 'Start tour',
      onAction: onStartTour,
    },
    {
      id: 'booking',
      title: 'Book your first dinner',
      description: bookingsCount > 0
        ? 'Great! You already have a booking.'
        : 'Browse upcoming dinners and secure a seat.',
      done: bookingsCount > 0,
      actionLabel: bookingsCount > 0 ? 'See dinners' : 'Browse dinners',
      onAction: onBookDinner ?? (() => {}),
    },
  ], [bookingsCount, completion, hasCompletedGuestTour, onBookDinner, onOpenWizard, onStartTour])

  const completedCount = steps.filter((step) => step.done).length
  const progress = Math.round((completedCount / steps.length) * 100)

  if (isDismissed && completedCount === steps.length) return null

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className={className}
        >
          <Card className="border border-coral-100/70 dark:border-coral-900/40 bg-white/90 dark:bg-[var(--background)]/90 shadow-[0_12px_45px_-25px_rgba(232,93,117,0.55)]">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-coral-500" />
                  Getting started
                </CardTitle>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  A three-step path to unlock better matches and bookings.
                </p>
              </div>
              <button
                aria-label="Dismiss onboarding tips"
                onClick={handleDismiss}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center gap-3">
                <ProgressBar value={progress} variant="secondary" className="flex-1" />
                <Badge variant="outline" className="border-coral-200 text-coral-600 dark:border-coral-900/50 dark:text-coral-300">
                  {completedCount}/{steps.length} done
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/60 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-coral-500/10 text-coral-600 p-2">
                        {step.id === 'profile' && <Compass className="w-4 h-4" />}
                        {step.id === 'tour' && <Sparkles className="w-4 h-4" />}
                        {step.id === 'booking' && <CalendarRange className="w-4 h-4" />}
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold text-[var(--foreground)]">{step.title}</p>
                        <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                      {step.done && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-label="Completed" />
                      )}
                    </div>

                    {!step.done && (
                      <Button
                        size="sm"
                        variant={step.id === 'profile' ? 'primary' : 'outline'}
                        className={step.id === 'profile'
                          ? 'bg-coral-500 hover:bg-coral-600 text-white'
                          : 'border-coral-200 text-coral-600 hover:border-coral-300 hover:text-coral-700'}
                        onClick={step.onAction}
                      >
                        {step.actionLabel}
                      </Button>
                    )}
                    {step.done && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        onClick={step.onAction}
                      >
                        {step.actionLabel}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
