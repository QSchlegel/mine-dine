'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled' | 'glass'
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      variant = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)

    const variants = {
      default: cn(
        'bg-[var(--background)]',
        'border-2 border-[var(--border)]',
        'hover:border-[var(--border-strong)]',
        'shadow-xs hover:shadow-sm'
      ),
      filled: cn(
        'bg-[var(--background-secondary)]',
        'border-2 border-transparent',
        'hover:bg-[var(--background-elevated)]',
        'shadow-xs hover:shadow-sm'
      ),
      glass: cn(
        'glass',
        'border-2 border-[var(--glass-border)]',
        'shadow-sm hover:shadow-md',
        'backdrop-blur-lg'
      ),
    }

    return (
      <div className="w-full">
        {label && (
          <label
            className={cn(
              'block text-sm font-medium mb-1.5 transition-colors duration-200',
              'text-[var(--foreground-secondary)]',
              isFocused && 'text-pink-500',
              error && 'text-danger-500'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              'flex h-12 w-full rounded-xl px-4 py-3 text-sm',
              'text-[var(--foreground)]',
              'placeholder:text-[var(--foreground-muted)]',
              'transition-all duration-300 ease-out',
              'focus:outline-none',
              variants[variant],
              isFocused && !error && 'border-pink-500 shadow-[var(--glow-primary)] -translate-y-0.5',
              error && 'border-danger-500 shadow-[0_0_20px_rgba(229,72,77,0.25)]',
              disabled && 'cursor-not-allowed opacity-50',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className
            )}
            ref={ref}
            disabled={disabled}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
              {rightIcon}
            </div>
          )}

          {/* Focus glow effect */}
          <AnimatePresence>
            {isFocused && !error && (
              <motion.div
                className="absolute inset-0 -z-10 rounded-xl bg-pink-500/10 blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Error or hint message */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-1.5 text-sm text-danger-500 flex items-center gap-1"
            >
              <ErrorIcon />
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-1.5 text-sm text-[var(--foreground-muted)]"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)

Input.displayName = 'Input'

function ErrorIcon() {
  return (
    <svg
      className="h-4 w-4 flex-shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// Search Input variant
export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onSearch?: (value: string) => void
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<SearchIcon />}
        className={cn('pr-4', className)}
        {...props}
      />
    )
  }
)

SearchInput.displayName = 'SearchInput'

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  )
}
