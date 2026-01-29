'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { calculateTipAmount, calculateStarCost, MAX_TIP_STARS } from '@/lib/reviews/tip'

export interface TipStarsPurchaseProps {
  bookingTotalPrice: number
  tipStars: number
  onTipStarsChange: (stars: number) => void
  isPaid?: boolean
  disabled?: boolean
  className?: string
}

export function TipStarsPurchase({
  bookingTotalPrice,
  tipStars,
  onTipStarsChange,
  isPaid,
  disabled,
  className,
}: TipStarsPurchaseProps) {
  const starCost = calculateStarCost(bookingTotalPrice)
  const totalTip = calculateTipAmount(bookingTotalPrice, tipStars)

  return (
    <div
      className={cn(
        'p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <span>💫</span>
            Unlock More Stars
          </h3>
          <p className="text-xs text-[var(--foreground-secondary)] mt-1">
            Show extra appreciation with tip stars
          </p>
        </div>
        {isPaid && (
          <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-500 rounded-full">
            Paid
          </span>
        )}
      </div>

      {/* Star selector */}
      <div className="flex items-center justify-center gap-1 mb-4">
        {Array.from({ length: MAX_TIP_STARS }).map((_, index) => {
          const starNumber = index + 1
          const isSelected = starNumber <= tipStars
          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => !disabled && !isPaid && onTipStarsChange(isSelected && tipStars === starNumber ? 0 : starNumber)}
              disabled={disabled || isPaid}
              className={cn(
                'relative p-1 transition-transform',
                !disabled && !isPaid && 'cursor-pointer hover:scale-110',
                (disabled || isPaid) && 'cursor-default'
              )}
              whileTap={!disabled && !isPaid ? { scale: 0.9 } : undefined}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isSelected ? 1 : 0.8,
                  opacity: isSelected ? 1 : 0.4,
                }}
                transition={{ duration: 0.15 }}
              >
                <StarIcon
                  className={cn(
                    'w-7 h-7 transition-colors',
                    isSelected
                      ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]'
                      : 'text-[var(--foreground-muted)]'
                  )}
                  filled={isSelected}
                />
              </motion.div>
            </motion.button>
          )
        })}
      </div>

      {/* Price info */}
      <div className="space-y-2 text-center">
        <p className="text-xs text-[var(--foreground-secondary)]">
          {starCost.toFixed(2)} EUR per star (1% of menu price)
        </p>

        {tipStars > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2 border-t border-[var(--border)]"
          >
            <p className="text-lg font-bold text-[var(--foreground)]">
              {tipStars} star{tipStars !== 1 && 's'} = {totalTip.toFixed(2)} EUR
            </p>
            <p className="text-xs text-[var(--foreground-secondary)]">
              tip for your host
            </p>
          </motion.div>
        )}

        {tipStars === 0 && (
          <p className="text-xs text-[var(--foreground-muted)] italic">
            Select stars above to add a tip
          </p>
        )}
      </div>
    </div>
  )
}

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

export default TipStarsPurchase
