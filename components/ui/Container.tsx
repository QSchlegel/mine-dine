'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Add consistent padding */
  padded?: boolean
  /** Center content horizontally */
  centered?: boolean
}

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', padded = true, centered = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          sizeClasses[size],
          centered && 'mx-auto',
          padded && 'px-4 sm:px-6 lg:px-8',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Container.displayName = 'Container'
