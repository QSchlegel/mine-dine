'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface DividerProps {
  /** Orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Text or element to display in the middle */
  children?: React.ReactNode
  /** Visual variant */
  variant?: 'default' | 'dashed' | 'dotted' | 'gradient'
  /** Spacing */
  spacing?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
}

const spacingClasses = {
  sm: {
    horizontal: 'my-2',
    vertical: 'mx-2',
  },
  md: {
    horizontal: 'my-4',
    vertical: 'mx-4',
  },
  lg: {
    horizontal: 'my-8',
    vertical: 'mx-8',
  },
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  children,
  variant = 'default',
  spacing = 'md',
  className,
}) => {
  const isHorizontal = orientation === 'horizontal'
  const spacingClass = spacingClasses[spacing][orientation]

  const lineClasses = cn(
    isHorizontal ? 'h-px w-full' : 'w-px h-full',
    variant === 'default' && 'bg-[var(--border)]',
    variant === 'dashed' && 'border-dashed',
    variant === 'dotted' && 'border-dotted',
    variant === 'gradient' && (
      isHorizontal
        ? 'bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent'
        : 'bg-gradient-to-b from-transparent via-[var(--border-strong)] to-transparent'
    )
  )

  if (!children) {
    return (
      <div
        role="separator"
        aria-orientation={orientation}
        className={cn(lineClasses, spacingClass, className)}
      />
    )
  }

  // With text/content
  if (isHorizontal) {
    return (
      <div
        role="separator"
        className={cn('flex items-center gap-4', spacingClass, className)}
      >
        <div className={cn('flex-1', lineClasses)} />
        <span className="text-sm text-[var(--foreground-muted)] font-medium">
          {children}
        </span>
        <div className={cn('flex-1', lineClasses)} />
      </div>
    )
  }

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn('flex flex-col items-center gap-4', spacingClass, className)}
    >
      <div className={cn('flex-1', lineClasses)} />
      <span className="text-sm text-[var(--foreground-muted)] font-medium">
        {children}
      </span>
      <div className={cn('flex-1', lineClasses)} />
    </div>
  )
}

// Decorative divider with icon
export interface IconDividerProps {
  icon: React.ReactNode
  className?: string
}

export const IconDivider: React.FC<IconDividerProps> = ({ icon, className }) => {
  return (
    <div className={cn('flex items-center gap-4 my-6', className)}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[var(--border)]" />
      <div className="text-[var(--foreground-muted)]">
        {icon}
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[var(--border)]" />
    </div>
  )
}
