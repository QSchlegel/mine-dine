'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Inbox } from 'lucide-react'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon to display */
  icon?: React.ReactNode
  /** Main title */
  title: string
  /** Description text */
  description?: string
  /** Primary action button */
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }
  /** Secondary action */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: {
    container: 'py-8',
    icon: 'h-10 w-10',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-base',
  },
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({
    className,
    icon,
    title,
    description,
    action,
    secondaryAction,
    size = 'md',
    ...props
  }, ref) => {
    const sizes = sizeClasses[size]

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center',
          sizes.container,
          className
        )}
        {...props}
      >
        <div className={cn(
          'mb-4 text-[var(--foreground-muted)]',
          sizes.icon,
          '[&>svg]:h-full [&>svg]:w-full'
        )}>
          {icon || <Inbox />}
        </div>

        <h3 className={cn(
          'font-semibold text-[var(--foreground)]',
          sizes.title
        )}>
          {title}
        </h3>

        {description && (
          <p className={cn(
            'mt-2 max-w-sm text-[var(--foreground-secondary)]',
            sizes.description
          )}>
            {description}
          </p>
        )}

        {(action || secondaryAction) && (
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            {action && (
              <Button
                variant={action.variant || 'primary'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant="ghost"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
)

EmptyState.displayName = 'EmptyState'
