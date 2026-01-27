'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface RatingProps {
  value?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
  onChange?: (value: number) => void
  showValue?: boolean
  className?: string
}

export const Rating: React.FC<RatingProps> = ({
  value = 0,
  max = 5,
  size = 'md',
  readOnly = false,
  onChange,
  showValue = false,
  className,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue !== null ? hoverValue : value

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const gaps = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  }

  const handleClick = (starValue: number) => {
    if (!readOnly && onChange) {
      onChange(starValue)
    }
  }

  return (
    <div className={cn('flex items-center', gaps[size], className)}>
      <div className={cn('flex', gaps[size])}>
        {Array.from({ length: max }).map((_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= displayValue

          return (
            <motion.button
              key={index}
              type="button"
              disabled={readOnly}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => !readOnly && setHoverValue(starValue)}
              onMouseLeave={() => !readOnly && setHoverValue(null)}
              className={cn(
                'relative transition-transform',
                !readOnly && 'cursor-pointer hover:scale-110',
                readOnly && 'cursor-default'
              )}
              whileTap={!readOnly ? { scale: 0.9 } : undefined}
            >
              {/* Background star (empty) */}
              <StarIcon
                className={cn(
                  sizes[size],
                  'text-[var(--foreground-muted)] opacity-30'
                )}
                filled={false}
              />

              {/* Foreground star (filled) */}
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{
                  opacity: isFilled ? 1 : 0,
                  scale: isFilled ? 1 : 0.8,
                }}
                transition={{ duration: 0.15 }}
              >
                <StarIcon
                  className={cn(
                    sizes[size],
                    'text-amber-400',
                    isFilled && 'drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                  )}
                  filled={true}
                />
              </motion.div>
            </motion.button>
          )
        })}
      </div>

      {showValue && (
        <span className="ml-2 text-sm font-medium text-[var(--foreground-secondary)] tabular-nums">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}

function StarIcon({ className, filled }: { className?: string; filled: boolean }) {
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

// Display-only rating with review count
export interface RatingDisplayProps {
  rating: number
  reviewCount?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  reviewCount,
  size = 'md',
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Rating value={rating} readOnly size={size} />
      <span className="text-sm text-[var(--foreground-secondary)]">
        {rating.toFixed(1)}
        {reviewCount !== undefined && (
          <span className="text-[var(--foreground-muted)]">
            {' '}({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        )}
      </span>
    </div>
  )
}
