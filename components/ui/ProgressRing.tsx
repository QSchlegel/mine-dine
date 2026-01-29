'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ProgressRingProps {
  /** Progress value from 0 to 100 */
  value: number
  /** Size of the ring */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  /** Show percentage text */
  showValue?: boolean
  /** Custom label instead of percentage */
  label?: string
  /** Stroke width */
  strokeWidth?: number
  /** Animate on mount */
  animate?: boolean
  /** Additional class names */
  className?: string
}

const sizeConfig = {
  sm: { size: 40, fontSize: 'text-xs', strokeWidth: 3 },
  md: { size: 64, fontSize: 'text-sm', strokeWidth: 4 },
  lg: { size: 96, fontSize: 'text-lg', strokeWidth: 5 },
  xl: { size: 128, fontSize: 'text-2xl', strokeWidth: 6 },
}

const variantColors = {
  primary: {
    track: 'stroke-coral-200 dark:stroke-coral-900/30',
    progress: 'stroke-coral-500 dark:stroke-coral-400',
    text: 'text-coral-600 dark:text-coral-400',
  },
  secondary: {
    track: 'stroke-accent-200 dark:stroke-accent-900/30',
    progress: 'stroke-accent-500 dark:stroke-accent-400',
    text: 'text-accent-600 dark:text-accent-400',
  },
  success: {
    track: 'stroke-success-100 dark:stroke-success-900/30',
    progress: 'stroke-success-500 dark:stroke-success-400',
    text: 'text-success-600 dark:text-success-400',
  },
  warning: {
    track: 'stroke-amber-200 dark:stroke-amber-900/30',
    progress: 'stroke-amber-500 dark:stroke-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    track: 'stroke-danger-100 dark:stroke-danger-900/30',
    progress: 'stroke-danger-500 dark:stroke-danger-400',
    text: 'text-danger-600 dark:text-danger-400',
  },
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 'md',
  variant = 'primary',
  showValue = true,
  label,
  strokeWidth: customStrokeWidth,
  animate = true,
  className,
}) => {
  const config = sizeConfig[size]
  const colors = variantColors[variant]
  const strokeWidth = customStrokeWidth ?? config.strokeWidth

  const radius = (config.size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const clampedValue = Math.min(100, Math.max(0, value))
  const offset = circumference - (clampedValue / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.size}
        height={config.size}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={colors.track}
        />
        {/* Progress arc */}
        <motion.circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colors.progress}
          style={{
            strokeDasharray: circumference,
          }}
          initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {(showValue || label) && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center font-semibold',
          config.fontSize,
          colors.text
        )}>
          {label ?? `${Math.round(clampedValue)}%`}
        </div>
      )}
    </div>
  )
}

// Linear progress bar variant
export interface ProgressBarProps {
  /** Progress value 0–100. Ignored when indeterminate is true. */
  value?: number
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  animate?: boolean
  /** When true, shows an animated indeterminate loading bar (no percentage). */
  indeterminate?: boolean
  className?: string
}

const barSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  variant = 'primary',
  size = 'md',
  showValue = false,
  animate = true,
  indeterminate = false,
  className,
}) => {
  const colors = variantColors[variant]
  const clampedValue = Math.min(100, Math.max(0, value))

  const barColorClass = cn(
    'h-full rounded-full',
    variant === 'primary' && 'bg-coral-500 dark:bg-coral-400',
    variant === 'secondary' && 'bg-accent-500 dark:bg-accent-400',
    variant === 'success' && 'bg-success-500 dark:bg-success-400',
    variant === 'warning' && 'bg-amber-500 dark:bg-amber-400',
    variant === 'danger' && 'bg-danger-500 dark:bg-danger-400'
  )

  return (
    <div className={cn('w-full', className)}>
      {showValue && !indeterminate && (
        <div className="flex justify-between mb-1">
          <span className={cn('text-xs font-medium', colors.text)}>
            Progress
          </span>
          <span className={cn('text-xs font-medium', colors.text)}>
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
      <div className={cn(
        'w-full rounded-full overflow-hidden',
        barSizes[size],
        'bg-[var(--background-secondary)]'
      )}>
        {indeterminate ? (
          <div className="relative h-full w-full">
            <motion.div
              className={cn(barColorClass, 'absolute inset-y-0')}
              style={{ width: '40%' }}
              animate={{ left: ['-40%', '100%'] }}
              transition={{
                repeat: Infinity,
                repeatType: 'loop',
                duration: 1.4,
                ease: 'easeInOut',
              }}
            />
          </div>
        ) : (
          <motion.div
            className={barColorClass}
            initial={animate ? { width: 0 } : { width: `${clampedValue}%` }}
            animate={{ width: `${clampedValue}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        )}
      </div>
    </div>
  )
}
