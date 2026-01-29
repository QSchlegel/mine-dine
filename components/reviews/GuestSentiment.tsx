'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type Sentiment = 'LIKE' | 'DISLIKE'

export interface GuestSentimentProps {
  onSelect: (sentiment: Sentiment) => void
  selected?: Sentiment | null
  disabled?: boolean
  className?: string
}

export function GuestSentiment({
  onSelect,
  selected,
  disabled,
  className,
}: GuestSentimentProps) {
  return (
    <div className={cn('flex items-center justify-center gap-6', className)}>
      {/* Dislike button */}
      <motion.button
        type="button"
        onClick={() => !disabled && onSelect('DISLIKE')}
        disabled={disabled}
        className={cn(
          'relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all',
          selected === 'DISLIKE'
            ? 'bg-red-500/20 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
            : 'bg-[var(--background-secondary)] border-2 border-transparent hover:border-red-500/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
        whileHover={!disabled ? { scale: 1.05 } : undefined}
      >
        <motion.div
          initial={false}
          animate={{
            scale: selected === 'DISLIKE' ? 1.1 : 1,
            rotate: selected === 'DISLIKE' ? [0, -10, 0] : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <ThumbsDownIcon
            className={cn(
              'w-10 h-10 transition-colors',
              selected === 'DISLIKE'
                ? 'text-red-500'
                : 'text-[var(--foreground-secondary)]'
            )}
            filled={selected === 'DISLIKE'}
          />
        </motion.div>
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            selected === 'DISLIKE'
              ? 'text-red-500'
              : 'text-[var(--foreground-secondary)]'
          )}
        >
          Not great
        </span>
      </motion.button>

      {/* Like button */}
      <motion.button
        type="button"
        onClick={() => !disabled && onSelect('LIKE')}
        disabled={disabled}
        className={cn(
          'relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all',
          selected === 'LIKE'
            ? 'bg-green-500/20 border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
            : 'bg-[var(--background-secondary)] border-2 border-transparent hover:border-green-500/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
        whileHover={!disabled ? { scale: 1.05 } : undefined}
      >
        <motion.div
          initial={false}
          animate={{
            scale: selected === 'LIKE' ? 1.1 : 1,
            rotate: selected === 'LIKE' ? [0, 10, 0] : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <ThumbsUpIcon
            className={cn(
              'w-10 h-10 transition-colors',
              selected === 'LIKE'
                ? 'text-green-500'
                : 'text-[var(--foreground-secondary)]'
            )}
            filled={selected === 'LIKE'}
          />
        </motion.div>
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            selected === 'LIKE'
              ? 'text-green-500'
              : 'text-[var(--foreground-secondary)]'
          )}
        >
          Great guest
        </span>
      </motion.button>
    </div>
  )
}

function ThumbsUpIcon({
  className,
  filled,
}: {
  className?: string
  filled?: boolean
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M7.5 10.5H5.25A2.25 2.25 0 003 12.75v5.25a2.25 2.25 0 002.25 2.25h1.5c.676 0 1.252-.473 1.463-1.108a4.5 4.5 0 012.07-2.602"
      />
    </svg>
  )
}

function ThumbsDownIcon({
  className,
  filled,
}: {
  className?: string
  filled?: boolean
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398C20.613 14.547 19.833 15 19 15h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.5 4.5 0 00-1.423-.23H6.504c-.618 0-1.217.247-1.605.729A11.95 11.95 0 002.25 12c0 .434.023.863.068 1.285C2.427 14.306 3.346 15 4.372 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.5a2.25 2.25 0 002.25 2.25.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384"
      />
    </svg>
  )
}

export default GuestSentiment
