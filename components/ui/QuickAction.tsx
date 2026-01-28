'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from './Card'
import { IconBadge } from './IconBadge'

export interface QuickActionProps {
  /** Action label */
  label: string
  /** Icon to display */
  icon: React.ReactNode
  /** Optional badge/count */
  badge?: string | number
  /** Icon color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  /** Click handler */
  onClick?: () => void
  /** Href for link behavior */
  href?: string
  /** Additional class names */
  className?: string
}

export const QuickAction: React.FC<QuickActionProps> = ({
  label,
  icon,
  badge,
  variant = 'default',
  onClick,
  href,
  className,
}) => {
  const handleClick = () => {
    if (href && typeof window !== 'undefined') {
      window.location.href = href
    }
    onClick?.()
  }

  return (
    <Card
      className={cn('cursor-pointer group', className)}
      hover="subtle"
      onClick={handleClick}
    >
      <CardContent className="p-6 text-center">
        <IconBadge
          icon={icon}
          variant={variant}
          size="md"
          className="mx-auto mb-3"
        />
        <p className="font-medium text-sm text-[var(--foreground)]">
          {label}
        </p>
        {badge !== undefined && (
          <span className={cn(
            'text-xs mt-1 inline-block',
            variant === 'default'
              ? 'text-[var(--foreground-secondary)]'
              : variant === 'primary'
              ? 'text-coral-600 dark:text-coral-400'
              : variant === 'secondary'
              ? 'text-accent-600 dark:text-accent-400'
              : variant === 'success'
              ? 'text-success-600 dark:text-success-400'
              : variant === 'warning'
              ? 'text-amber-600 dark:text-amber-400'
              : variant === 'danger'
              ? 'text-danger-600 dark:text-danger-400'
              : 'text-blue-600 dark:text-blue-400'
          )}>
            {badge}
          </span>
        )}
      </CardContent>
    </Card>
  )
}

// Grid wrapper for quick actions
export interface QuickActionGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  columns = 4,
  className,
  children,
  ...props
}) => {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }

  return (
    <div
      className={cn('grid gap-4 sm:gap-6', gridClasses[columns], className)}
      {...props}
    >
      {children}
    </div>
  )
}
