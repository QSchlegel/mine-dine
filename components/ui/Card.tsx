'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { cardHover, cardHoverSubtle } from '@/lib/animations'

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'glass' | 'elevated' | 'outline'
  hover?: 'none' | 'lift' | 'glow' | 'subtle'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = 'subtle', children, ...props }, ref) => {
    const variants = {
      default: cn(
        'rounded-2xl border transition-all duration-300 ease-out',
        'bg-[var(--background-elevated)]',
        'border-[var(--border)]',
        'shadow-sm hover:shadow-md'
      ),
      glass: cn(
        'rounded-2xl transition-all duration-300 ease-out',
        'glass',
        'shadow-sm hover:shadow-md'
      ),
      elevated: cn(
        'rounded-2xl border transition-all duration-300 ease-out',
        'bg-[var(--background-elevated)]',
        'border-[var(--border)]',
        'shadow-md hover:shadow-lg',
        'dark:shadow-elevated-dark dark:hover:shadow-lg'
      ),
      outline: cn(
        'rounded-2xl border-2 transition-all duration-300 ease-out',
        'bg-transparent',
        'border-[var(--border-strong)]',
        'hover:border-[var(--primary)]/30',
        'hover:shadow-sm'
      ),
    }

    const hoverEffects = {
      none: {},
      lift: cardHover,
      glow: {
        rest: {
          boxShadow: '0 0 0 rgba(232, 93, 117, 0)',
          transform: 'translateY(0)',
        },
        hover: {
          boxShadow: '0 0 32px rgba(232, 93, 117, 0.22), 0 0 12px rgba(232, 93, 117, 0.14)',
          borderColor: 'rgba(232, 93, 117, 0.45)',
          transform: 'translateY(-3px)',
        },
      },
      subtle: cardHoverSubtle,
    }

    return (
      <motion.div
        ref={ref}
        className={cn(variants[variant], className)}
        variants={hoverEffects[hover]}
        initial="rest"
        whileHover="hover"
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

// Card Header
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-2 p-7', className)}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

// Card Title
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        'text-xl font-semibold leading-tight tracking-tight',
        'text-[var(--foreground)]',
        className
      )}
      {...props}
    />
  )
)

CardTitle.displayName = 'CardTitle'

// Card Description
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-[var(--foreground-secondary)]', className)}
      {...props}
    />
  )
)

CardDescription.displayName = 'CardDescription'

// Card Content
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-7 pt-0', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

// Card Footer
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center p-7 pt-0',
        'border-t border-[var(--border)] mt-auto',
        className
      )}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'

// Card Image (for dinner cards, etc.)
export interface CardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  overlay?: boolean
  aspectRatio?: 'video' | 'square' | 'portrait'
}

export const CardImage = React.forwardRef<HTMLDivElement, CardImageProps>(
  ({ className, src, alt, overlay = true, aspectRatio = 'video', children, ...props }, ref) => {
    const aspectRatios = {
      video: 'aspect-video',
      square: 'aspect-square',
      portrait: 'aspect-[3/4]',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-t-xl',
          aspectRatios[aspectRatio],
          className
        )}
        {...props}
      >
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt || ''}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}
        {children}
      </div>
    )
  }
)

CardImage.displayName = 'CardImage'

// Accent line for cards
export const CardAccent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { color?: 'coral' | 'blue' | 'purple' }
>(({ className, color = 'coral', ...props }, ref) => {
  const colors = {
    coral: 'bg-gradient-to-r from-coral-500 to-coral-400',
    blue: 'bg-gradient-to-r from-accent-500 to-accent-400',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-400',
  }

  return (
    <div
      ref={ref}
      className={cn('h-1 w-full rounded-t-xl', colors[color], className)}
      {...props}
    />
  )
})

CardAccent.displayName = 'CardAccent'
