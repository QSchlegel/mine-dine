'use client'

import { useState, useCallback } from 'react'

export interface UseAuthFormOptions {
  onSubmit: (data: { email: string; password: string; name?: string }) => Promise<void>
  validateEmail?: (email: string) => string | null
  validatePassword?: (password: string) => string | null
  minPasswordLength?: number // For login, set to 0 or undefined. For signup, set to 8
}

export interface AuthFormState {
  email: string
  password: string
  name?: string
  confirmPassword?: string
  errors: {
    email?: string
    password?: string
    name?: string
    confirmPassword?: string
    form?: string
  }
  isLoading: boolean
}

export function useAuthForm({ onSubmit, validateEmail, validatePassword, minPasswordLength }: UseAuthFormOptions) {
  const [state, setState] = useState<AuthFormState>({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    errors: {},
    isLoading: false,
  })

  const validateEmailFormat = useCallback((email: string, allowEmpty?: boolean): string | null => {
    if (!email) {
      return allowEmpty ? null : 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return null
  }, [])

  const validatePasswordLength = useCallback((password: string, minLength?: number, allowEmpty?: boolean): string | null => {
    if (!password) {
      return allowEmpty ? null : 'Password is required'
    }
    const min = minLength ?? 0 // Default to 0 for login, can be overridden for signup
    if (min > 0 && password.length < min) {
      return `Password must be at least ${min} characters`
    }
    return null
  }, [])

  const setEmail = useCallback((email: string) => {
    // Only validate if email has content (allow empty during typing)
    const emailError = email ? (validateEmail?.(email) || validateEmailFormat(email, false)) : null
    setState((prev) => ({
      ...prev,
      email,
      errors: {
        ...prev.errors,
        email: emailError || undefined,
        form: undefined,
      },
    }))
  }, [validateEmail, validateEmailFormat])

  const setPassword = useCallback((password: string) => {
    // Only validate if password has content (allow empty during typing)
    const passwordError = password ? (validatePassword?.(password) || validatePasswordLength(password, minPasswordLength, false)) : null
    setState((prev) => {
      // Re-validate confirm password if it exists
      let confirmPasswordError = prev.errors.confirmPassword
      if (prev.confirmPassword && prev.confirmPassword !== password) {
        confirmPasswordError = 'Passwords do not match'
      } else if (prev.confirmPassword && prev.confirmPassword === password) {
        confirmPasswordError = undefined
      }
      
      return {
        ...prev,
        password,
        errors: {
          ...prev.errors,
          password: passwordError || undefined,
          confirmPassword: confirmPasswordError,
          form: undefined,
        },
      }
    })
  }, [validatePassword, validatePasswordLength, minPasswordLength])

  const setName = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      name,
      errors: {
        ...prev.errors,
        name: undefined,
        form: undefined,
      },
    }))
  }, [])

  const setConfirmPassword = useCallback((confirmPassword: string, password?: string) => {
    const pwd = password || state.password
    let error: string | undefined
    if (!confirmPassword) {
      error = 'Please confirm your password'
    } else if (confirmPassword !== pwd) {
      error = 'Passwords do not match'
    }
    setState((prev) => ({
      ...prev,
      confirmPassword,
      errors: {
        ...prev.errors,
        confirmPassword: error,
        form: undefined,
      },
    }))
  }, [state.password])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    console.log('handleSubmit called', { email: state.email, password: state.password ? '***' : '' })
    e.preventDefault()
    e.stopPropagation()
    
    // Validate all fields
    const emailError = validateEmail?.(state.email) || validateEmailFormat(state.email, false)
    const passwordError = validatePassword?.(state.password) || validatePasswordLength(state.password, minPasswordLength, false)
    
    console.log('Validation errors', { emailError, passwordError })
    
    const errors: AuthFormState['errors'] = {}
    if (emailError) errors.email = emailError
    if (passwordError) errors.password = passwordError
    
    // Check confirm password only if it has a value (i.e., on signup page)
    if (state.confirmPassword && state.confirmPassword.length > 0 && state.confirmPassword !== state.password) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (Object.keys(errors).length > 0) {
      console.log('Validation failed, setting errors', errors)
      setState((prev) => ({ ...prev, errors }))
      return
    }
    
    console.log('Validation passed, submitting...')
    setState((prev) => ({ ...prev, isLoading: true, errors: {} }))
    
    try {
      await onSubmit({
        email: state.email,
        password: state.password,
        name: state.name,
      })
      // Reset loading state on success (though navigation will likely happen)
      setState((prev) => ({ ...prev, isLoading: false }))
    } catch (error) {
      console.error('Submit error', error)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setState((prev) => ({
        ...prev,
        isLoading: false,
        errors: { form: errorMessage },
      }))
    }
  }, [state, validateEmail, validatePassword, validateEmailFormat, validatePasswordLength, minPasswordLength, onSubmit])

  const setFormError = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, form: message },
      isLoading: false,
    }))
  }, [])

  const clearErrors = useCallback(() => {
    setState((prev) => ({ ...prev, errors: {} }))
  }, [])

  return {
    ...state,
    setEmail,
    setPassword,
    setName,
    setConfirmPassword,
    handleSubmit,
    setFormError,
    clearErrors,
  }
}
