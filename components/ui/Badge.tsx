'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'coral' | 'blue' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  dot?: boolean
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', glow = false, dot = false, children, ...props }, ref) => {
    const variants = {
      default: cn(
        'bg-[var(--background-secondary)]',
        'text-[var(--foreground-secondary)]',
        'border border-[var(--border)]'
      ),
      coral: cn(
        'bg-coral-500/10',
        'text-coral-500',
        'border border-coral-500/20',
        glow && 'shadow-[0_0_12px_rgba(245,78,0,0.25)]'
      ),
      blue: cn(
        'bg-accent-500/10',
        'text-accent-500',
        'border border-accent-500/20',
        glow && 'shadow-[0_0_12px_rgba(110,140,249,0.25)]'
      ),
      success: cn(
        'bg-success-500/10',
        'text-success-500',
        'border border-success-500/20',
        glow && 'shadow-[0_0_12px_rgba(48,164,108,0.25)]'
      ),
      warning: cn(
        'bg-warning-500/10',
        'text-warning-500',
        'border border-warning-500/20',
        glow && 'shadow-[0_0_12px_rgba(245,166,35,0.25)]'
      ),
      danger: cn(
        'bg-danger-500/10',
        'text-danger-500',
        'border border-danger-500/20',
        glow && 'shadow-[0_0_12px_rgba(229,72,77,0.25)]'
      ),
      outline: cn(
        'bg-transparent',
        'text-[var(--foreground-secondary)]',
        'border border-[var(--border-strong)]'
      ),
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium',
          'transition-all duration-200',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              variant === 'coral' && 'bg-coral-500',
              variant === 'blue' && 'bg-accent-500',
              variant === 'success' && 'bg-success-500',
              variant === 'warning' && 'bg-warning-500',
              variant === 'danger' && 'bg-danger-500',
              (variant === 'default' || variant === 'outline') && 'bg-[var(--foreground-muted)]'
            )}
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Status Badge for booking/dinner status
export type StatusType = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'draft' | 'published'

const statusConfig: Record<StatusType, { variant: BadgeProps['variant']; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  confirmed: { variant: 'success', label: 'Confirmed' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
  completed: { variant: 'blue', label: 'Completed' },
  draft: { variant: 'default', label: 'Draft' },
  published: { variant: 'coral', label: 'Published' },
}

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  status: StatusType
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    const config = statusConfig[status]

    return (
      <Badge ref={ref} variant={config.variant} dot {...props}>
        {config.label}
      </Badge>
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

// Animated notification badge
export interface NotificationBadgeProps {
  count: number
  max?: number
  className?: string
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  className,
}) => {
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'absolute -top-1 -right-1 flex items-center justify-center',
        'min-w-[18px] h-[18px] px-1 rounded-full',
        'bg-coral-500 text-white text-xs font-bold',
        'shadow-glow-coral',
        className
      )}
    >
      {displayCount}
    </motion.span>
  )
}
