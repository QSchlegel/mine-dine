'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface PriceDisplayProps {
  /** Price amount */
  amount: number
  /** Currency code */
  currency?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Show "per person" suffix */
  perPerson?: boolean
  /** Original price for showing discounts */
  originalAmount?: number
  /** Additional class names */
  className?: string
}

const sizeConfig = {
  sm: { price: 'text-sm', currency: 'text-xs', suffix: 'text-xs' },
  md: { price: 'text-lg', currency: 'text-sm', suffix: 'text-sm' },
  lg: { price: 'text-2xl', currency: 'text-base', suffix: 'text-sm' },
  xl: { price: 'text-3xl', currency: 'text-lg', suffix: 'text-base' },
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  currency = 'EUR',
  size = 'md',
  perPerson = false,
  originalAmount,
  className,
}) => {
  const config = sizeConfig[size]
  const symbol = currencySymbols[currency] || currency

  const formatPrice = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const hasDiscount = originalAmount && originalAmount > amount
  const discountPercent = hasDiscount
    ? Math.round(((originalAmount - amount) / originalAmount) * 100)
    : 0

  return (
    <div className={cn('inline-flex items-baseline gap-1 flex-wrap', className)}>
      {hasDiscount && (
        <span className={cn(
          'line-through text-[var(--foreground-muted)]',
          config.suffix
        )}>
          {symbol}{formatPrice(originalAmount)}
        </span>
      )}
      <span className={cn('font-bold text-[var(--foreground)]', config.price)}>
        <span className={cn('font-normal', config.currency)}>{symbol}</span>
        {formatPrice(amount)}
      </span>
      {perPerson && (
        <span className={cn('text-[var(--foreground-secondary)]', config.suffix)}>
          / person
        </span>
      )}
      {hasDiscount && (
        <span className={cn(
          'ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
          'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400'
        )}>
          -{discountPercent}%
        </span>
      )}
    </div>
  )
}

// Price range display
export interface PriceRangeProps {
  min: number
  max: number
  currency?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const PriceRange: React.FC<PriceRangeProps> = ({
  min,
  max,
  currency = 'EUR',
  size = 'md',
  className,
}) => {
  const config = sizeConfig[size]
  const symbol = currencySymbols[currency] || currency

  if (min === max) {
    return (
      <PriceDisplay amount={min} currency={currency} size={size} className={className} />
    )
  }

  return (
    <span className={cn('font-semibold text-[var(--foreground)]', config.price, className)}>
      <span className={cn('font-normal', config.currency)}>{symbol}</span>
      {min.toFixed(0)} - {symbol}{max.toFixed(0)}
    </span>
  )
}
