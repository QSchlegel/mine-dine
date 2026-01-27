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
