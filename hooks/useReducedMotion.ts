'use client'

import { useState, useEffect } from 'react'
import { shouldReduceAnimations, shouldSkipHeavyEffects, isLowEndDevice } from '@/lib/performance'

/**
 * Hook to detect if animations should be reduced
 * Respects user's prefers-reduced-motion setting and device capabilities
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Initial check
    setReducedMotion(shouldReduceAnimations())

    // Listen for changes to prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReducedMotion(shouldReduceAnimations())

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return reducedMotion
}

/**
 * Hook to determine if heavy effects should be skipped
 * (particle backgrounds, WebGL, complex animations)
 */
export function useSkipHeavyEffects(): boolean {
  const [skipEffects, setSkipEffects] = useState(true) // Default to skip on SSR

  useEffect(() => {
    setSkipEffects(shouldSkipHeavyEffects())
  }, [])

  return skipEffects
}

/**
 * Hook to detect low-end device
 */
export function useLowEndDevice(): boolean {
  const [isLowEnd, setIsLowEnd] = useState(false)

  useEffect(() => {
    setIsLowEnd(isLowEndDevice())
  }, [])

  return isLowEnd
}

/**
 * Get optimized framer-motion transition based on device capabilities
 */
export function useOptimizedTransition() {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return {
      duration: 0,
      ease: 'linear',
    }
  }

  return {
    duration: 0.3,
    ease: [0.16, 1, 0.3, 1],
  }
}
