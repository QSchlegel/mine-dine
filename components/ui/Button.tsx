'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  href?: string
  motion?: 'none' | 'micro'
}

const baseStyles = cn(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
  'transition-all duration-300 ease-out',
  'focus:outline-none focus:ring-2 focus:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  'shadow-sm hover:shadow-md active:shadow-sm'
)

const variantStyles = {
  primary: cn(
    'bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 text-white',
    'hover:from-pink-600 hover:via-pink-700 hover:to-pink-800',
    'hover:shadow-[0_0_24px_rgba(236,72,153,0.35),0_0_8px_rgba(236,72,153,0.2)]',
    'focus:ring-pink-500 focus:ring-offset-2',
    'active:from-pink-700 active:via-pink-800 active:to-pink-900',
    'border border-pink-400/20'
  ),
  secondary: cn(
    'bg-gradient-to-r from-cyan-500 via-cyan-600 to-cyan-700 text-white',
    'hover:from-cyan-600 hover:via-cyan-700 hover:to-cyan-800',
    'hover:shadow-[0_0_24px_rgba(6,182,212,0.35),0_0_8px_rgba(6,182,212,0.2)]',
    'focus:ring-cyan-500 focus:ring-offset-2',
    'active:from-cyan-700 active:via-cyan-800 active:to-cyan-900',
    'border border-cyan-400/20'
  ),
  outline: cn(
    'border-2 border-pink-500/60 text-pink-600 bg-transparent',
    'hover:bg-pink-500/10 hover:border-pink-500',
    'hover:shadow-[0_0_20px_rgba(236,72,153,0.2)]',
    'focus:ring-pink-500 focus:ring-offset-2',
    'dark:text-pink-400 dark:border-pink-400/60',
    'dark:hover:bg-pink-500/15'
  ),
  ghost: cn(
    'bg-transparent',
    'text-[var(--foreground)]',
    'hover:bg-[var(--background-secondary)]',
    'hover:shadow-sm',
    'focus:ring-pink-500 focus:ring-offset-2'
  ),
  danger: cn(
    'bg-gradient-to-r from-danger-500 to-danger-600 text-white',
    'hover:from-danger-600 hover:to-red-700',
    'hover:shadow-[0_0_24px_rgba(229,72,77,0.35),0_0_8px_rgba(229,72,77,0.2)]',
    'focus:ring-danger-500 focus:ring-offset-2',
    'border border-red-400/20'
  ),
  glass: cn(
    'glass text-[var(--foreground)]',
    'border border-[var(--glass-border)]',
    'hover:border-[var(--border-strong)]',
    'shadow-sm hover:shadow-md',
    'backdrop-blur-lg',
    'focus:ring-pink-500 focus:ring-offset-2'
  ),
}

const sizeStyles = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

const microMotionStyles = 'transform hover:-translate-y-0.5 active:translate-y-0'

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      href,
      motion = 'none',
      ...props
    },
    ref
  ) => {
    const classes = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      motion === 'micro' && microMotionStyles,
      className
    )

    const content = (
      <>
        {isLoading && <LoadingSpinner />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </>
    )

    if (href) {
      const isDisabled = Boolean(disabled || isLoading)
      return (
        <Link
          href={href}
          className={cn(classes, isDisabled && 'pointer-events-none opacity-50')}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          {content}
        </Link>
      )
    }

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </button>
    )
  }
)

Button.displayName = 'Button'

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode
  'aria-label': string
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    }

    return (
      <Button
        ref={ref}
        className={cn('!px-0', sizes[size], className)}
        size={size}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'
