'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ToggleProps {
  /** Current checked state */
  checked: boolean
  /** Callback when toggle changes */
  onChange: (checked: boolean) => void
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Color when active */
  variant?: 'primary' | 'secondary' | 'success'
  /** Disabled state */
  disabled?: boolean
  /** Label text */
  label?: string
  /** Description text */
  description?: string
  /** Additional class names */
  className?: string
}

const sizeConfig = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'h-3 w-3',
    translate: 'translate-x-4',
    offset: 'translate-x-0.5',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5',
    offset: 'translate-x-0.5',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'h-6 w-6',
    translate: 'translate-x-7',
    offset: 'translate-x-0.5',
  },
}

const variantColors = {
  primary: 'bg-coral-500 dark:bg-coral-400',
  secondary: 'bg-accent-500 dark:bg-accent-400',
  success: 'bg-success-500 dark:bg-success-400',
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  size = 'md',
  variant = 'primary',
  disabled = false,
  label,
  description,
  className,
}) => {
  const config = sizeConfig[size]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!disabled) {
        onChange(!checked)
      }
    }
  }

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500',
        config.track,
        checked ? variantColors[variant] : 'bg-[var(--background-tertiary)]',
        disabled && 'cursor-not-allowed opacity-50',
        !label && !description && className
      )}
    >
      <motion.span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0',
          config.thumb
        )}
        initial={false}
        animate={{
          x: checked ? parseInt(config.translate.replace('translate-x-', '')) * 4 : 2,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )

  if (label || description) {
    return (
      <div className={cn('flex items-start justify-between gap-4', className)}>
        <div className="flex-1 min-w-0">
          {label && (
            <label className="text-sm font-medium text-[var(--foreground)]">
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-[var(--foreground-secondary)] mt-0.5">
              {description}
            </p>
          )}
        </div>
        {toggle}
      </div>
    )
  }

  return toggle
}

// Toggle group for multiple options
export interface ToggleGroupOption {
  value: string
  label: string
  icon?: React.ReactNode
}

export interface ToggleGroupProps {
  options: ToggleGroupOption[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const groupSizes = {
  sm: 'text-xs px-2.5 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({
  options,
  value,
  onChange,
  size = 'md',
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex rounded-lg p-1',
        'bg-[var(--background-secondary)]',
        className
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const isSelected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative inline-flex items-center gap-1.5 rounded-md font-medium transition-all duration-200',
              groupSizes[size],
              isSelected
                ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
