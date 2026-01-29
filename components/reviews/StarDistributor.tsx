'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { BASE_STARS } from '@/lib/reviews/tip'

export interface StarDistribution {
  hospitality: number
  cleanliness: number
  taste: number
}

interface CategoryRowProps {
  label: string
  icon: React.ReactNode
  value: number
  maxValue: number
  availableToAdd: number
  onChange: (newValue: number) => void
  disabled?: boolean
}

function CategoryRow({
  label,
  icon,
  value,
  maxValue,
  availableToAdd,
  onChange,
  disabled,
}: CategoryRowProps) {
  const canAdd = value < maxValue && availableToAdd > 0
  const canRemove = value > 0

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex items-center gap-2 w-32">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </span>
      </div>

      <div className="flex items-center gap-1 flex-1">
        {/* Remove button */}
        <motion.button
          type="button"
          onClick={() => canRemove && onChange(value - 1)}
          disabled={disabled || !canRemove}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
            canRemove && !disabled
              ? 'bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] text-[var(--foreground)]'
              : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] cursor-not-allowed opacity-50'
          )}
          whileTap={canRemove && !disabled ? { scale: 0.9 } : undefined}
        >
          <MinusIcon className="w-4 h-4" />
        </motion.button>

        {/* Star display */}
        <div className="flex gap-1 px-2">
          {Array.from({ length: maxValue }).map((_, index) => {
            const isFilled = index < value
            return (
              <motion.div
                key={index}
                initial={false}
                animate={{
                  scale: isFilled ? 1 : 0.8,
                  opacity: isFilled ? 1 : 0.3,
                }}
                transition={{ duration: 0.15 }}
              >
                <StarIcon
                  className={cn(
                    'w-6 h-6 transition-colors',
                    isFilled
                      ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                      : 'text-[var(--foreground-muted)]'
                  )}
                  filled={isFilled}
                />
              </motion.div>
            )
          })}
        </div>

        {/* Add button */}
        <motion.button
          type="button"
          onClick={() => canAdd && onChange(value + 1)}
          disabled={disabled || !canAdd}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
            canAdd && !disabled
              ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-500'
              : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] cursor-not-allowed opacity-50'
          )}
          whileTap={canAdd && !disabled ? { scale: 0.9 } : undefined}
        >
          <PlusIcon className="w-4 h-4" />
        </motion.button>

        {/* Value display */}
        <span className="w-8 text-center text-sm font-medium text-[var(--foreground-secondary)]">
          {value}/{maxValue}
        </span>
      </div>
    </div>
  )
}

export interface StarDistributorProps {
  distribution: StarDistribution
  tipStars: number
  onDistributionChange: (distribution: StarDistribution) => void
  disabled?: boolean
  className?: string
}

export function StarDistributor({
  distribution,
  tipStars,
  onDistributionChange,
  disabled,
  className,
}: StarDistributorProps) {
  const totalAvailable = BASE_STARS + tipStars
  const totalUsed =
    distribution.hospitality + distribution.cleanliness + distribution.taste
  const remaining = totalAvailable - totalUsed

  const handleChange = (
    category: keyof StarDistribution,
    newValue: number
  ) => {
    onDistributionChange({
      ...distribution,
      [category]: newValue,
    })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Star pool indicator */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            Stars to distribute
          </p>
          <p className="text-xs text-[var(--foreground-secondary)]">
            {BASE_STARS} base{tipStars > 0 && ` + ${tipStars} tip`} stars
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="popLayout">
            {Array.from({ length: remaining }).map((_, index) => (
              <motion.div
                key={`remaining-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <StarIcon
                  className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                  filled
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <span className="text-sm font-bold text-[var(--foreground)] ml-2">
            {remaining}
          </span>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            remaining === 0 ? 'bg-green-500' : 'bg-pink-500'
          )}
          initial={false}
          animate={{ width: `${(totalUsed / totalAvailable) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Category rows */}
      <div className="divide-y divide-[var(--border)]">
        <CategoryRow
          label="Hospitality"
          icon="🤝"
          value={distribution.hospitality}
          maxValue={5}
          availableToAdd={remaining}
          onChange={(v) => handleChange('hospitality', v)}
          disabled={disabled}
        />
        <CategoryRow
          label="Cleanliness"
          icon="✨"
          value={distribution.cleanliness}
          maxValue={5}
          availableToAdd={remaining}
          onChange={(v) => handleChange('cleanliness', v)}
          disabled={disabled}
        />
        <CategoryRow
          label="Taste"
          icon="🍽️"
          value={distribution.taste}
          maxValue={5}
          availableToAdd={remaining}
          onChange={(v) => handleChange('taste', v)}
          disabled={disabled}
        />
      </div>

      {/* Validation message */}
      <AnimatePresence>
        {remaining > 0 && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-amber-500 text-center"
          >
            Distribute {remaining} more star{remaining !== 1 && 's'} to submit
          </motion.p>
        )}
        {remaining === 0 && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-green-500 text-center"
          >
            All stars distributed
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// Icons
function StarIcon({
  className,
  filled,
}: {
  className?: string
  filled: boolean
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M10 5v10M5 10h10" strokeLinecap="round" />
    </svg>
  )
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 10h10" strokeLinecap="round" />
    </svg>
  )
}

export default StarDistributor
