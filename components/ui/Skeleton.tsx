'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rounded'
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'rounded-md',
      circular: 'rounded-full',
      rounded: 'rounded-xl',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'shimmer',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

// Pre-built skeleton patterns
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          'h-4',
          i === lines - 1 ? 'w-3/4' : 'w-full'
        )}
      />
    ))}
  </div>
)

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4',
      className
    )}
  >
    <Skeleton className="h-40 w-full mb-4" variant="rounded" />
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-8" variant="circular" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
)

export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return <Skeleton className={cn(sizes[size], className)} variant="circular" />
}

export const SkeletonButton: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-28',
  }

  return <Skeleton className={cn(sizes[size], 'rounded-lg', className)} />
}

// Dinner card skeleton
export const DinnerCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] overflow-hidden',
      className
    )}
  >
    <Skeleton className="h-48 w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" variant="circular" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  </div>
)

// Profile skeleton
export const ProfileSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Cover & Avatar */}
    <div className="relative">
      <Skeleton className="h-32 w-full" variant="rounded" />
      <Skeleton className="absolute -bottom-6 left-4 h-20 w-20 border-4 border-[var(--background)]" variant="circular" />
    </div>

    {/* Info */}
    <div className="pt-8 px-4 space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-32" />
      <SkeletonText lines={2} />
    </div>
  </div>
)

// Stat card skeleton
export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-6',
      className
    )}
  >
    <div className="flex items-center justify-between mb-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4" variant="rounded" />
    </div>
    <Skeleton className="h-8 w-16 mb-2" />
    <Skeleton className="h-3 w-28" />
  </div>
)

// Page header skeleton
export const PageHeaderSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  showSubtitle?: boolean
  className?: string
}> = ({ size = 'lg', showSubtitle = true, className }) => {
  const sizes = {
    sm: { title: 'h-6 w-36', subtitle: 'h-4 w-48', spacing: 'mb-6' },
    md: { title: 'h-7 w-48', subtitle: 'h-5 w-56', spacing: 'mb-8' },
    lg: { title: 'h-9 w-56', subtitle: 'h-5 w-72', spacing: 'mb-12' },
  }
  const s = sizes[size]

  return (
    <div className={cn(s.spacing, className)}>
      <Skeleton className={s.title} />
      {showSubtitle && <Skeleton className={cn(s.subtitle, 'mt-2')} />}
    </div>
  )
}

// Action card skeleton
export const ActionCardSkeleton: React.FC<{
  variant?: 'default' | 'gradient'
  className?: string
}> = ({ variant = 'default', className }) => (
  <div
    className={cn(
      'rounded-xl p-6',
      variant === 'gradient'
        ? 'bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-tertiary)]'
        : 'border border-[var(--border)] bg-[var(--background-elevated)]',
      className
    )}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-6 w-6" variant="circular" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-5 w-5" variant="rounded" />
    </div>
  </div>
)

// Quick action grid skeleton
export const QuickActionGridSkeleton: React.FC<{
  count?: number
  columns?: 2 | 3 | 4
  className?: string
}> = ({ count = 4, columns = 4, className }) => {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4 sm:gap-6', gridClasses[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-6 text-center"
        >
          <Skeleton className="h-10 w-10 mx-auto mb-3" variant="circular" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
      ))}
    </div>
  )
}
