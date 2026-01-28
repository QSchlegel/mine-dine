'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

export interface ActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card title */
  title: string
  /** Card description */
  description?: string
  /** Icon to display */
  icon?: React.ReactNode
  /** Gradient variant for featured cards */
  variant?: 'default' | 'primary' | 'secondary' | 'accent'
  /** Show arrow indicator */
  showArrow?: boolean
  /** Click handler */
  onClick?: () => void
  /** Href for link behavior */
  href?: string
  /** Disabled state */
  disabled?: boolean
}

const variantStyles = {
  default: {
    container: cn(
      'bg-[var(--background-elevated)]',
      'border border-[var(--border)]',
      'hover:border-[var(--border-strong)]',
      'hover:shadow-md'
    ),
    text: 'text-[var(--foreground)]',
    description: 'text-[var(--foreground-secondary)]',
    icon: 'text-[var(--foreground-secondary)]',
  },
  primary: {
    container: cn(
      'bg-gradient-to-br from-coral-500 to-pink-600',
      'border-0',
      'hover:from-coral-600 hover:to-pink-700',
      'hover:shadow-glow-coral'
    ),
    text: 'text-white',
    description: 'text-white/90',
    icon: 'text-white',
  },
  secondary: {
    container: cn(
      'bg-gradient-to-br from-emerald-500 to-accent-600',
      'border-0',
      'hover:from-emerald-600 hover:to-accent-700',
      'hover:shadow-glow-teal'
    ),
    text: 'text-white',
    description: 'text-white/90',
    icon: 'text-white',
  },
  accent: {
    container: cn(
      'bg-gradient-to-br from-amber-500 to-orange-600',
      'border-0',
      'hover:from-amber-600 hover:to-orange-700',
      'hover:shadow-glow-amber'
    ),
    text: 'text-white',
    description: 'text-white/90',
    icon: 'text-white',
  },
}

export const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(
  ({
    className,
    title,
    description,
    icon,
    variant = 'default',
    showArrow = true,
    onClick,
    href,
    disabled = false,
    children,
    ...props
  }, ref) => {
    const styles = variantStyles[variant]

    const handleClick = () => {
      if (disabled) return
      if (href && typeof window !== 'undefined') {
        window.location.href = href
      }
      onClick?.()
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl p-6 transition-all duration-300',
          'cursor-pointer',
          styles.container,
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        whileHover={!disabled ? { scale: 1.02, y: -2 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {icon && (
                <span className={cn('flex-shrink-0', styles.icon)}>
                  {icon}
                </span>
              )}
              <span className={cn('font-bold text-lg', styles.text)}>
                {title}
              </span>
            </div>
            {description && (
              <p className={cn('text-sm', styles.description)}>
                {description}
              </p>
            )}
            {children}
          </div>
          {showArrow && (
            <ArrowRight className={cn('h-5 w-5 flex-shrink-0 ml-4', styles.icon)} />
          )}
        </div>
      </motion.div>
    )
  }
)

ActionCard.displayName = 'ActionCard'

// Grid wrapper for action cards
export interface ActionGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3
}

export const ActionGrid: React.FC<ActionGridProps> = ({
  columns = 2,
  className,
  children,
  ...props
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
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
