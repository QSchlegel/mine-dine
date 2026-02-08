/**
 * Performance utilities for optimizing app experience on mobile and low-end devices
 */

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Detect if device is likely low-end based on available signals
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false

  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4
  if (cores <= 2) return true

  // Check device memory (if available)
  const nav = navigator as Navigator & { deviceMemory?: number }
  if (nav.deviceMemory && nav.deviceMemory <= 2) return true

  // Check connection type (if available)
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
  if (conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') return true

  return false
}

/**
 * Detect if device is mobile based on screen width and touch capability
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isNarrowScreen = window.innerWidth < 768

  return hasTouch && isNarrowScreen
}

/**
 * Check if we should use reduced/simplified animations
 * Returns true if: user prefers reduced motion, low-end device, or mobile
 */
export function shouldReduceAnimations(): boolean {
  return prefersReducedMotion() || isLowEndDevice()
}

/**
 * Check if we should skip heavy visual effects entirely
 * (particle backgrounds, WebGL, etc.)
 */
export function shouldSkipHeavyEffects(): boolean {
  return prefersReducedMotion() || isLowEndDevice() || isMobileDevice()
}

/**
 * Get recommended animation duration multiplier
 * Returns 0 for no animations, 0.5 for reduced, 1 for full
 */
export function getAnimationDurationMultiplier(): number {
  if (prefersReducedMotion()) return 0
  if (isLowEndDevice()) return 0.5
  return 1
}

/**
 * Intersection Observer options for lazy loading
 */
export const lazyLoadOptions: IntersectionObserverInit = {
  rootMargin: '100px',
  threshold: 0.1,
}

/**
 * Debounce function for performance-sensitive operations
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Throttle function for scroll/resize handlers
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
