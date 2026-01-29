'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Section heading */
  title?: string
  /** Section description */
  description?: string
  /** Optional actions for the section header */
  actions?: React.ReactNode
  /** Spacing variant */
  spacing?: 'sm' | 'md' | 'lg'
  /** Use as a different HTML element */
  as?: 'section' | 'div' | 'article'
}

const spacingClasses = {
  sm: 'mb-6',
  md: 'mb-8',
  lg: 'mb-12',
}

const headerSpacingClasses = {
  sm: 'mb-4',
  md: 'mb-6',
  lg: 'mb-8',
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({
    className,
    title,
    description,
    actions,
    spacing = 'md',
    as: Component = 'section',
    children,
    ...props
  }, ref) => {
    return (
      <Component
        ref={ref as any}
        className={cn(spacingClasses[spacing], className)}
        {...props}
      >
        {(title || description || actions) && (
          <div className={cn(
            'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2',
            headerSpacingClasses[spacing]
          )}>
            <div>
              {title && (
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        )}
        {children}
      </Component>
    )
  }
)

Section.displayName = 'Section'
