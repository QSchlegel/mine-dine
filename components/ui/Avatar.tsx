'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
  ringColor?: 'coral' | 'blue' | 'success'
  status?: 'online' | 'offline' | 'away'
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt,
      name,
      size = 'md',
      ring = false,
      ringColor = 'coral',
      status,
      ...props
    },
    ref
  ) => {
    const sizes = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    }

    const ringColors = {
      coral: 'ring-coral-500 shadow-glow-coral',
      blue: 'ring-accent-500 shadow-glow-blue',
      success: 'ring-success-500 shadow-[0_0_15px_rgba(48,164,108,0.3)]',
    }

    const statusColors = {
      online: 'bg-success-500',
      offline: 'bg-[var(--foreground-muted)]',
      away: 'bg-warning-500',
    }

    const initials = name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return (
      <div className="relative inline-block" ref={ref} {...props}>
        <div
          className={cn(
            'relative flex items-center justify-center overflow-hidden rounded-full',
            'bg-[var(--background-secondary)]',
            'transition-all duration-200',
            sizes[size],
            ring && `ring-2 ${ringColors[ringColor]}`,
            className
          )}
        >
          {src ? (
            <Image
              src={src}
              alt={alt || name || 'Avatar'}
              fill
              className="object-cover"
            />
          ) : initials ? (
            <span className="font-medium text-[var(--foreground-secondary)]">
              {initials}
            </span>
          ) : (
            <DefaultAvatarIcon className={cn(
              size === 'xs' && 'h-4 w-4',
              size === 'sm' && 'h-5 w-5',
              size === 'md' && 'h-6 w-6',
              size === 'lg' && 'h-7 w-7',
              size === 'xl' && 'h-9 w-9'
            )} />
          )}
        </div>

        {/* Status indicator */}
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 block rounded-full',
              'border-2 border-[var(--background)]',
              statusColors[status],
              size === 'xs' && 'h-2 w-2',
              size === 'sm' && 'h-2.5 w-2.5',
              size === 'md' && 'h-3 w-3',
              size === 'lg' && 'h-3.5 w-3.5',
              size === 'xl' && 'h-4 w-4'
            )}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

function DefaultAvatarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('text-[var(--foreground-muted)]', className)}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

// Avatar Group for showing multiple avatars
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<{ src?: string; name?: string }>
  max?: number
  size?: AvatarProps['size']
}

export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, avatars, max = 4, size = 'md', ...props }, ref) => {
    const visibleAvatars = avatars.slice(0, max)
    const remainingCount = avatars.length - max

    return (
      <div
        ref={ref}
        className={cn('flex -space-x-2', className)}
        {...props}
      >
        {visibleAvatars.map((avatar, index) => (
          <Avatar
            key={index}
            src={avatar.src}
            name={avatar.name}
            size={size}
            className="ring-2 ring-[var(--background)]"
          />
        ))}

        {remainingCount > 0 && (
          <div
            className={cn(
              'flex items-center justify-center rounded-full',
              'bg-[var(--background-secondary)]',
              'ring-2 ring-[var(--background)]',
              'text-[var(--foreground-secondary)] font-medium',
              size === 'xs' && 'h-6 w-6 text-[10px]',
              size === 'sm' && 'h-8 w-8 text-xs',
              size === 'md' && 'h-10 w-10 text-xs',
              size === 'lg' && 'h-12 w-12 text-sm',
              size === 'xl' && 'h-16 w-16 text-base'
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    )
  }
)

AvatarGroup.displayName = 'AvatarGroup'
