'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main heading text */
  title: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Optional actions to display on the right */
  actions?: React.ReactNode
  /** Size variant for the heading */
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: {
    title: 'text-xl font-semibold',
    subtitle: 'text-sm',
    gap: 'mb-1',
    spacing: 'mb-6',
  },
  md: {
    title: 'text-2xl font-bold',
    subtitle: 'text-base',
    gap: 'mt-2',
    spacing: 'mb-8',
  },
  lg: {
    title: 'text-3xl font-bold',
    subtitle: 'text-lg',
    gap: 'mt-3',
    spacing: 'mb-12',
  },
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, actions, size = 'lg', ...props }, ref) => {
    const sizes = sizeClasses[size]

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4',
          sizes.spacing,
          className
        )}
        {...props}
      >
        <div>
          <h1 className={cn(sizes.title, 'text-[var(--foreground)]')}>
            {title}
          </h1>
          {subtitle && (
            <p className={cn(sizes.subtitle, sizes.gap, 'text-[var(--foreground-secondary)]')}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    )
  }
)

PageHeader.displayName = 'PageHeader'
