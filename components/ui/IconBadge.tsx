'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface IconBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg'
  /** Color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  /** The icon to display */
  icon: React.ReactNode
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const iconSizeClasses = {
  sm: '[&>svg]:h-4 [&>svg]:w-4',
  md: '[&>svg]:h-5 [&>svg]:w-5',
  lg: '[&>svg]:h-6 [&>svg]:w-6',
}

const variantClasses = {
  default: {
    bg: 'bg-[var(--background-secondary)] group-hover:bg-[var(--background-tertiary)]',
    icon: 'text-[var(--foreground-secondary)]',
  },
  primary: {
    bg: 'bg-coral-100 dark:bg-coral-500/20 group-hover:bg-coral-200 dark:group-hover:bg-coral-500/30',
    icon: 'text-coral-600 dark:text-coral-400',
  },
  secondary: {
    bg: 'bg-accent-100 dark:bg-accent-500/20 group-hover:bg-accent-200 dark:group-hover:bg-accent-500/30',
    icon: 'text-accent-600 dark:text-accent-400',
  },
  success: {
    bg: 'bg-success-100 dark:bg-success-500/20 group-hover:bg-success-200 dark:group-hover:bg-success-500/30',
    icon: 'text-success-600 dark:text-success-400',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-500/20 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/30',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    bg: 'bg-danger-100 dark:bg-danger-500/20 group-hover:bg-danger-200 dark:group-hover:bg-danger-500/30',
    icon: 'text-danger-600 dark:text-danger-400',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-500/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
}

export const IconBadge = React.forwardRef<HTMLDivElement, IconBadgeProps>(
  ({ className, size = 'md', variant = 'default', icon, ...props }, ref) => {
    const variantStyle = variantClasses[variant]

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-full flex items-center justify-center transition-colors duration-200',
          sizeClasses[size],
          iconSizeClasses[size],
          variantStyle.bg,
          variantStyle.icon,
          className
        )}
        {...props}
      >
        {icon}
      </div>
    )
  }
)

IconBadge.displayName = 'IconBadge'
