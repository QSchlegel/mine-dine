'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  className?: string
  containerClassName?: string
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  onLoad?: () => void
}

// Simple blur placeholder - a tiny grey box
const shimmerPlaceholder = `data:image/svg+xml;base64,${Buffer.from(
  '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#1a1a1a"/></svg>'
).toString('base64')}`

/**
 * Optimized image component with lazy loading, blur placeholder, and responsive sizing.
 * Uses Next.js Image for automatic optimization.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  containerClassName,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  placeholder = 'blur',
  onLoad,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const resolvedSrc = getProxiedImageUrl(src) ?? src

  // Handle external URLs that can't be optimized.
  const isExternal =
    resolvedSrc?.startsWith('http') &&
    !resolvedSrc.includes(process.env.NEXT_PUBLIC_APP_URL || '')

  if (error || !resolvedSrc) {
    return (
      <div
        className={cn(
          'bg-[var(--background-secondary)] flex items-center justify-center',
          fill ? 'absolute inset-0' : '',
          containerClassName
        )}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-[var(--foreground-muted)] text-sm">No image</span>
      </div>
    )
  }

  // For external images, use unoptimized mode
  if (isExternal) {
    return (
      <div className={cn('relative', containerClassName)}>
        <Image
          src={resolvedSrc}
          alt={alt}
          width={fill ? undefined : (width || 400)}
          height={fill ? undefined : (height || 300)}
          fill={fill}
          sizes={sizes}
          quality={quality}
          priority={priority}
          unoptimized
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          onLoad={() => {
            setIsLoading(false)
            onLoad?.()
          }}
          onError={() => setError(true)}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-[var(--background-secondary)] animate-pulse" />
        )}
      </div>
    )
  }

  return (
    <div className={cn('relative', containerClassName)}>
      <Image
        src={resolvedSrc}
        alt={alt}
        width={fill ? undefined : (width || 400)}
        height={fill ? undefined : (height || 300)}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={shimmerPlaceholder}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={() => {
          setIsLoading(false)
          onLoad?.()
        }}
        onError={() => setError(true)}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--background-secondary)] animate-pulse" />
      )}
    </div>
  )
}

export default OptimizedImage
