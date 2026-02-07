'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from './Card'

export interface StatCardProps {
  /** Stat title/label */
  title: string
  /** The main stat value */
  value: string | number
  /** Optional subtitle or additional context */
  subtitle?: string
  /** Optional icon */
  icon?: React.ReactNode
  /** Optional trend indicator */
  trend?: {
    value: number
    label?: string
    isPositive?: boolean
  }
  /** Click handler */
  onClick?: () => void
  /** Loading state */
  isLoading?: boolean
  /** Additional class names */
  className?: string
  /** Glass surface */
  surface?: 'default' | 'glass'
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
  isLoading = false,
  className,
  surface = 'glass',
}) => {
  const content = (
    <Card
      className={cn(
        onClick && 'cursor-pointer',
        className
      )}
      variant={surface === 'glass' ? 'glass' : 'default'}
      hover={onClick ? 'subtle' : 'none'}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
        <CardTitle className="text-sm font-medium text-[var(--foreground-secondary)]">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-[var(--foreground-muted)]">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {isLoading ? (
          <>
            <div className="h-8 w-16 bg-[var(--background-secondary)] rounded animate-pulse mb-1" />
            <div className="h-3 w-24 bg-[var(--background-secondary)] rounded animate-pulse" />
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--foreground)]">
                {value}
              </span>
              {trend && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive
                      ? 'text-success-600 dark:text-success-400'
                      : 'text-danger-600 dark:text-danger-400'
                  )}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                  {trend.label && ` ${trend.label}`}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                {subtitle}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )

  return content
}

// Grid wrapper for multiple stat cards
export interface StatGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4
}

export const StatGrid: React.FC<StatGridProps> = ({
  columns = 2,
  className,
  children,
  ...props
}) => {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
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
