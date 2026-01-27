'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  variant?: 'default' | 'filled'
  showCount?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      variant = 'default',
      showCount = false,
      maxLength,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [internalValue, setInternalValue] = useState('')

    const currentValue = value !== undefined ? String(value) : internalValue
    const charCount = currentValue.length

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
          <textarea
            className={cn(
              'flex min-h-[120px] w-full rounded-xl px-4 py-3 text-sm resize-y',
              'text-[var(--foreground)]',
              'placeholder:text-[var(--foreground-muted)]',
              'transition-all duration-300 ease-out',
              'focus:outline-none',
              variants[variant],
              isFocused && !error && 'border-pink-500 shadow-[var(--glow-primary)] -translate-y-0.5',
              error && 'border-danger-500 shadow-[0_0_20px_rgba(229,72,77,0.25)]',
              disabled && 'cursor-not-allowed opacity-50 resize-none',
              className
            )}
            ref={ref}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            onChange={(e) => {
              setInternalValue(e.target.value)
              props.onChange?.(e)
            }}
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

          {/* Focus glow effect */}
          <AnimatePresence>
            {isFocused && !error && (
              <motion.div
                className="absolute inset-0 -z-10 rounded-xl bg-pink-500/10 blur-sm"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer: error/hint and character count */}
        <div className="flex items-start justify-between mt-1.5 gap-4">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-sm text-danger-500 flex items-center gap-1"
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
                className="text-sm text-[var(--foreground-muted)]"
              >
                {hint}
              </motion.p>
            ) : (
              <span />
            )}
          </AnimatePresence>

          {showCount && maxLength && (
            <span
              className={cn(
                'text-sm text-[var(--foreground-muted)] tabular-nums',
                charCount >= maxLength && 'text-danger-500'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

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
