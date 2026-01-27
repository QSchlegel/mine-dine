'use client'

import { useState, useCallback, useEffect } from 'react'
import { PasswordStrength } from '@/components/auth/PasswordInput'

export interface PasswordValidationResult {
  strength: PasswordStrength
  isValid: boolean
  errors: string[]
  hints: string[]
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

export function usePasswordValidation(password: string, minLength: number = 8) {
  const [validation, setValidation] = useState<PasswordValidationResult>({
    strength: 'none',
    isValid: false,
    errors: [],
    hints: [],
  })

  useEffect(() => {
    if (!password) {
      setValidation({
        strength: 'none',
        isValid: false,
        errors: [],
        hints: [],
      })
      return
    }

    const errors: string[] = []
    const hints: string[] = []

    // Length validation
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`)
    }

    // Strength calculation
    const strength = calculatePasswordStrength(password)

    // Generate hints based on missing requirements
    if (!/[a-z]/.test(password)) {
      hints.push('Add lowercase letters')
    }
    if (!/[A-Z]/.test(password)) {
      hints.push('Add uppercase letters')
    }
    if (!/[0-9]/.test(password)) {
      hints.push('Add numbers')
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      hints.push('Add special characters')
    }
    if (password.length < 12) {
      hints.push('Use at least 12 characters for better security')
    }

    setValidation({
      strength,
      isValid: errors.length === 0 && password.length >= minLength,
      errors,
      hints,
    })
  }, [password, minLength])

  const validateMatch = useCallback((confirmPassword: string): boolean => {
    return password === confirmPassword
  }, [password])

  return {
    ...validation,
    validateMatch,
  }
}
