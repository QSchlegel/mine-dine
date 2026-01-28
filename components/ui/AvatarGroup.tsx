'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarGroupItem {
  src?: string
  alt?: string
  name?: string
}

export interface AvatarGroupProps {
  /** Array of avatar data */
  avatars: AvatarGroupItem[]
  /** Maximum avatars to show before +N */
  max?: number
  /** Size of avatars */
  size?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
}

const sizeConfig = {
  sm: {
    avatar: 'h-6 w-6',
    text: 'text-[10px]',
    overlap: '-ml-2',
    border: 'ring-1',
  },
  md: {
    avatar: 'h-8 w-8',
    text: 'text-xs',
    overlap: '-ml-2.5',
    border: 'ring-2',
  },
  lg: {
    avatar: 'h-10 w-10',
    text: 'text-sm',
    overlap: '-ml-3',
    border: 'ring-2',
  },
}

// Generate consistent color from string
function stringToColor(str: string): string {
  const colors = [
    'bg-coral-500 dark:bg-coral-600',
    'bg-accent-500 dark:bg-accent-600',
    'bg-amber-500 dark:bg-amber-600',
    'bg-purple-500 dark:bg-purple-600',
    'bg-blue-500 dark:bg-blue-600',
    'bg-emerald-500 dark:bg-emerald-600',
    'bg-pink-500 dark:bg-pink-600',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'md',
  className,
}) => {
  const config = sizeConfig[size]
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn('flex items-center', className)}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            'relative rounded-full ring-[var(--background)] flex items-center justify-center overflow-hidden',
            config.avatar,
            config.border,
            index > 0 && config.overlap
          )}
        >
          {avatar.src ? (
            <img
              src={avatar.src}
              alt={avatar.alt || avatar.name || 'Avatar'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'h-full w-full flex items-center justify-center text-white font-medium',
                config.text,
                stringToColor(avatar.name || String(index))
              )}
            >
              {getInitials(avatar.name)}
            </div>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'relative rounded-full ring-[var(--background)] flex items-center justify-center',
            'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)]',
            config.avatar,
            config.border,
            config.overlap,
            config.text,
            'font-medium'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

// Single avatar with status indicator
export interface AvatarWithStatusProps {
  src?: string
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'away' | 'busy'
  className?: string
}

const avatarSizes = {
  sm: { avatar: 'h-8 w-8', text: 'text-xs', status: 'h-2 w-2' },
  md: { avatar: 'h-10 w-10', text: 'text-sm', status: 'h-2.5 w-2.5' },
  lg: { avatar: 'h-12 w-12', text: 'text-base', status: 'h-3 w-3' },
  xl: { avatar: 'h-16 w-16', text: 'text-lg', status: 'h-4 w-4' },
}

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-gray-400',
  away: 'bg-amber-500',
  busy: 'bg-danger-500',
}

export const AvatarWithStatus: React.FC<AvatarWithStatusProps> = ({
  src,
  alt,
  name,
  size = 'md',
  status,
  className,
}) => {
  const config = avatarSizes[size]

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center',
          config.avatar
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'h-full w-full flex items-center justify-center text-white font-medium',
              config.text,
              stringToColor(name || 'default')
            )}
          >
            {getInitials(name)}
          </div>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--background)]',
            config.status,
            statusColors[status]
          )}
        />
      )}
    </div>
  )
}
