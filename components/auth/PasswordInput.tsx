'use client'

import React, { useState } from 'react'
import { Input, InputProps } from '@/components/ui/Input'
import { Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showStrengthIndicator?: boolean
  onStrengthChange?: (strength: PasswordStrength) => void
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'none'

const strengthColors = {
  weak: 'bg-red-500',
  fair: 'bg-amber-500',
  good: 'bg-blue-500',
  strong: 'bg-green-500',
  none: 'bg-[var(--border)]',
}

const strengthLabels = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
  none: '',
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) return 'none'
  if (password.length < 6) return 'weak'
  
  let strength = 0
  
  // Length check
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  
  // Character variety checks
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  
  if (strength <= 2) return 'weak'
  if (strength === 3) return 'fair'
  if (strength === 4) return 'good'
  return 'strong'
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      showStrengthIndicator = false,
      onStrengthChange,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false)
    const password = typeof value === 'string' ? value : ''
    const strength = showStrengthIndicator ? calculatePasswordStrength(password) : 'none'

    React.useEffect(() => {
      if (onStrengthChange) {
        onStrengthChange(strength)
      }
    }, [strength, onStrengthChange])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
    }

    return (
      <div className="w-full">
        <Input
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          rightIcon={
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label={isVisible ? 'Hide password' : 'Show password'}
            >
              {isVisible ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          }
          {...props}
        />

        {/* Password Strength Indicator */}
        {showStrengthIndicator && password && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 space-y-1.5"
            >
              {/* Strength Bar */}
              <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'flex-1 rounded-full transition-all duration-300',
                      level <= getStrengthLevel(strength)
                        ? strengthColors[strength]
                        : 'bg-[var(--border)]'
                    )}
                  />
                ))}
              </div>

              {/* Strength Label */}
              {strength !== 'none' && (
                <p
                  className={cn(
                    'text-xs font-medium transition-colors',
                    strength === 'weak' && 'text-red-500',
                    strength === 'fair' && 'text-amber-500',
                    strength === 'good' && 'text-blue-500',
                    strength === 'strong' && 'text-green-500'
                  )}
                >
                  Password strength: {strengthLabels[strength]}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

function getStrengthLevel(strength: PasswordStrength): number {
  switch (strength) {
    case 'weak':
      return 1
    case 'fair':
      return 2
    case 'good':
      return 3
    case 'strong':
      return 4
    default:
      return 0
  }
}
