'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface TagChipProps {
  /** Tag label */
  label: string
  /** Optional icon */
  icon?: React.ReactNode
  /** Color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'dietary' | 'cuisine'
  /** Size */
  size?: 'sm' | 'md' | 'lg'
  /** Is removable */
  removable?: boolean
  /** On remove callback */
  onRemove?: () => void
  /** Is selected */
  selected?: boolean
  /** On click for selection */
  onClick?: () => void
  /** Additional class names */
  className?: string
}

const variantStyles = {
  default: {
    base: 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] border-[var(--border)]',
    selected: 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]',
  },
  primary: {
    base: 'bg-coral-50 text-coral-700 border-coral-200 dark:bg-coral-500/10 dark:text-coral-400 dark:border-coral-500/30',
    selected: 'bg-coral-500 text-white border-coral-500',
  },
  secondary: {
    base: 'bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-500/10 dark:text-accent-400 dark:border-accent-500/30',
    selected: 'bg-accent-500 text-white border-accent-500',
  },
  success: {
    base: 'bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/30',
    selected: 'bg-success-500 text-white border-success-500',
  },
  warning: {
    base: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    selected: 'bg-amber-500 text-white border-amber-500',
  },
  dietary: {
    base: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
    selected: 'bg-emerald-500 text-white border-emerald-500',
  },
  cuisine: {
    base: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30',
    selected: 'bg-purple-500 text-white border-purple-500',
  },
}

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
}

export const TagChip = React.forwardRef<HTMLSpanElement, TagChipProps>(
  ({
    label,
    icon,
    variant = 'default',
    size = 'md',
    removable = false,
    onRemove,
    selected = false,
    onClick,
    className,
  }, ref) => {
    const styles = variantStyles[variant]
    const isClickable = !!onClick

    const content = (
      <>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{label}</span>
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove?.()
            }}
            className={cn(
              'flex-shrink-0 rounded-full p-0.5 -mr-1',
              'hover:bg-black/10 dark:hover:bg-white/10',
              'transition-colors'
            )}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </>
    )

    const baseClasses = cn(
      'inline-flex items-center rounded-full border font-medium transition-all duration-200',
      sizeStyles[size],
      selected ? styles.selected : styles.base,
      isClickable && 'cursor-pointer hover:scale-105',
      className
    )

    if (isClickable) {
      return (
        <motion.button
          type="button"
          onClick={onClick}
          className={baseClasses}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {content}
        </motion.button>
      )
    }

    return (
      <span ref={ref} className={baseClasses}>
        {content}
      </span>
    )
  }
)

TagChip.displayName = 'TagChip'

// Tag group for displaying multiple tags
export interface TagGroupProps {
  tags: Array<{ id: string; label: string; icon?: React.ReactNode }>
  variant?: TagChipProps['variant']
  size?: TagChipProps['size']
  max?: number
  className?: string
}

export const TagGroup: React.FC<TagGroupProps> = ({
  tags,
  variant = 'default',
  size = 'sm',
  max,
  className,
}) => {
  const visibleTags = max ? tags.slice(0, max) : tags
  const remaining = max ? tags.length - max : 0

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visibleTags.map((tag) => (
        <TagChip
          key={tag.id}
          label={tag.label}
          icon={tag.icon}
          variant={variant}
          size={size}
        />
      ))}
      {remaining > 0 && (
        <span className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5',
          'text-xs text-[var(--foreground-muted)]',
          'bg-[var(--background-secondary)]'
        )}>
          +{remaining} more
        </span>
      )}
    </div>
  )
}
