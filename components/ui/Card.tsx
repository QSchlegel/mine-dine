'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'outline'
  hover?: 'none' | 'lift' | 'glow' | 'subtle'
  motion?: 'none' | 'micro'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      hover = 'subtle',
      motion = 'none',
      children,
      ...props
    },
    ref
  ) => {
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

    const hoverClasses = {
      none: '',
      lift: 'hover:-translate-y-1',
      glow: 'hover:shadow-[0_0_32px_rgba(232,93,117,0.22),0_0_12px_rgba(232,93,117,0.14)] hover:border-[rgba(232,93,117,0.45)]',
      subtle: 'hover:-translate-y-0.5',
    }

    const motionClass = motion === 'micro' ? 'transform-gpu' : ''

    return (
      <div
        ref={ref}
        className={cn(variants[variant], hoverClasses[hover], motionClass, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

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

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-7 pt-0', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

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

export interface CardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  overlay?: boolean
  aspectRatio?: 'video' | 'square' | 'portrait'
  priority?: boolean
  sizes?: string
}

export const CardImage = React.forwardRef<HTMLDivElement, CardImageProps>(
  (
    {
      className,
      src,
      alt,
      overlay = true,
      aspectRatio = 'video',
      priority = false,
      sizes,
      children,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)
    const proxiedSrc = getProxiedImageUrl(src) ?? src

    const aspectRatios = {
      video: 'aspect-video',
      square: 'aspect-square',
      portrait: 'aspect-[3/4]',
    }

    const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'

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
        {proxiedSrc && !error ? (
          <Image
            src={proxiedSrc}
            alt={alt || ''}
            fill
            sizes={defaultSizes}
            priority={priority}
            quality={75}
            className={cn(
              'object-cover transition-all duration-300 group-hover:scale-105',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => setError(true)}
            unoptimized={proxiedSrc.startsWith('http')}
          />
        ) : null}
        {isLoading && proxiedSrc && !error && (
          <div className="absolute inset-0 bg-[var(--background-secondary)] animate-pulse" />
        )}
        {error && (
          <div className="absolute inset-0 bg-[var(--background-secondary)] flex items-center justify-center">
            <span className="text-[var(--foreground-muted)] text-sm">Image unavailable</span>
          </div>
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
