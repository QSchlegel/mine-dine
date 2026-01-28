'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface CountdownProps {
  /** Target date/time */
  targetDate: Date | string
  /** Callback when countdown completes */
  onComplete?: () => void
  /** Display style */
  variant?: 'default' | 'compact' | 'minimal'
  /** Size */
  size?: 'sm' | 'md' | 'lg'
  /** Show labels */
  showLabels?: boolean
  /** Label for when countdown is complete */
  completedLabel?: string
  /** Additional class names */
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isComplete: boolean
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isComplete: false,
  }
}

const sizeConfig = {
  sm: {
    value: 'text-lg font-bold',
    label: 'text-[10px]',
    gap: 'gap-2',
    padding: 'px-2 py-1',
  },
  md: {
    value: 'text-2xl font-bold',
    label: 'text-xs',
    gap: 'gap-3',
    padding: 'px-3 py-2',
  },
  lg: {
    value: 'text-4xl font-bold',
    label: 'text-sm',
    gap: 'gap-4',
    padding: 'px-4 py-3',
  },
}

export const Countdown: React.FC<CountdownProps> = ({
  targetDate,
  onComplete,
  variant = 'default',
  size = 'md',
  showLabels = true,
  completedLabel = 'Event Started!',
  className,
}) => {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(target))

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(target)
      setTimeLeft(newTimeLeft)

      if (newTimeLeft.isComplete) {
        clearInterval(timer)
        onComplete?.()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [target, onComplete])

  const config = sizeConfig[size]

  if (timeLeft.isComplete) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'text-center font-semibold text-coral-500 dark:text-coral-400',
          config.value,
          className
        )}
      >
        {completedLabel}
      </motion.div>
    )
  }

  if (variant === 'minimal') {
    const formatMinimal = () => {
      if (timeLeft.days > 0) return `${timeLeft.days}d ${timeLeft.hours}h`
      if (timeLeft.hours > 0) return `${timeLeft.hours}h ${timeLeft.minutes}m`
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`
    }

    return (
      <span className={cn('font-mono text-[var(--foreground)]', className)}>
        {formatMinimal()}
      </span>
    )
  }

  if (variant === 'compact') {
    const pad = (n: number) => n.toString().padStart(2, '0')
    const parts = []
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`)
    parts.push(`${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`)

    return (
      <span className={cn('font-mono font-bold text-[var(--foreground)]', className)}>
        {parts.join(' ')}
      </span>
    )
  }

  // Default variant with individual blocks
  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Minutes' },
    { value: timeLeft.seconds, label: 'Seconds' },
  ].filter((unit, index) => timeLeft.days > 0 || index > 0)

  return (
    <div className={cn('flex items-center justify-center', config.gap, className)}>
      {units.map((unit, index) => (
        <React.Fragment key={unit.label}>
          <div className="text-center">
            <div
              className={cn(
                'rounded-lg bg-[var(--background-secondary)]',
                'text-[var(--foreground)]',
                config.padding,
                config.value
              )}
            >
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={unit.value}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block tabular-nums"
                >
                  {unit.value.toString().padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
            </div>
            {showLabels && (
              <p className={cn('mt-1 text-[var(--foreground-muted)] uppercase tracking-wide', config.label)}>
                {unit.label}
              </p>
            )}
          </div>
          {index < units.length - 1 && (
            <span className={cn('text-[var(--foreground-muted)]', config.value)}>:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Simple countdown badge
export interface CountdownBadgeProps {
  targetDate: Date | string
  className?: string
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  targetDate,
  className,
}) => {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(target))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(target))
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [target])

  if (timeLeft.isComplete) {
    return (
      <span className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        'bg-coral-100 text-coral-700 dark:bg-coral-500/20 dark:text-coral-400',
        className
      )}>
        Live now
      </span>
    )
  }

  const formatBadge = () => {
    if (timeLeft.days > 0) return `${timeLeft.days}d left`
    if (timeLeft.hours > 0) return `${timeLeft.hours}h left`
    return `${timeLeft.minutes}m left`
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
      className
    )}>
      {formatBadge()}
    </span>
  )
}
