'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface InteractionState {
  // Normalized position from center (-1 to 1)
  x: number
  y: number

  // Raw pixel position
  rawX: number
  rawY: number

  // Device orientation (mobile gyroscope)
  tiltX: number // gamma normalized to -1 to 1
  tiltY: number // beta normalized to -1 to 1

  // Velocity (for momentum effects)
  velocityX: number
  velocityY: number

  // State flags
  isActive: boolean // User is actively interacting
  isMobile: boolean // Mobile device detected
  hasGyroscope: boolean // Gyroscope available
  isReducedMotion: boolean
}

export interface UseInteractionOptions {
  smoothing?: number // 0-1, higher = smoother (default: 0.1)
  gyroSensitivity?: number // Multiplier for gyroscope input (default: 1)
  deadzone?: number // Ignore movements below this threshold (default: 0.02)
  enabled?: boolean // Master toggle (default: true)
}

const initialState: InteractionState = {
  x: 0,
  y: 0,
  rawX: 0,
  rawY: 0,
  tiltX: 0,
  tiltY: 0,
  velocityX: 0,
  velocityY: 0,
  isActive: false,
  isMobile: false,
  hasGyroscope: false,
  isReducedMotion: false,
}

// iOS 13+ requires explicit permission for DeviceOrientation
export async function requestGyroscopePermission(): Promise<boolean> {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as any).requestPermission === 'function'
  ) {
    try {
      const response = await (DeviceOrientationEvent as any).requestPermission()
      return response === 'granted'
    } catch {
      return false
    }
  }
  // Non-iOS devices don't need permission
  return true
}

export function useInteraction(options: UseInteractionOptions = {}): InteractionState {
  const {
    smoothing = 0.1,
    gyroSensitivity = 1,
    deadzone = 0.02,
    enabled = true,
  } = options

  const [state, setState] = useState<InteractionState>(initialState)

  // Refs for raw values (updated synchronously in event handlers)
  const rawStateRef = useRef({
    x: 0,
    y: 0,
    rawX: 0,
    rawY: 0,
    tiltX: 0,
    tiltY: 0,
    isActive: false,
  })

  // Refs for smooth interpolated values
  const smoothRef = useRef({ x: 0, y: 0 })
  const prevRef = useRef({ x: 0, y: 0 })

  // Device capability flags
  const [isMobile, setIsMobile] = useState(false)
  const [hasGyroscope, setHasGyroscope] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [gyroPermissionGranted, setGyroPermissionGranted] = useState(false)

  // Detect device capabilities
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check mobile
    const mobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || 'ontouchstart' in window

    setIsMobile(mobile)

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    setIsReducedMotion(prefersReducedMotion)

    // Check gyroscope support
    const checkGyroscope = () => {
      if ('DeviceOrientationEvent' in window) {
        setHasGyroscope(true)

        // iOS 13+ requires permission - check if already granted
        if (
          typeof (DeviceOrientationEvent as any).requestPermission === 'function'
        ) {
          // Permission hasn't been requested yet, will be requested on user interaction
          setGyroPermissionGranted(false)
        } else {
          // Non-iOS devices have implicit permission
          setGyroPermissionGranted(true)
        }
      }
    }
    checkGyroscope()

    // Listen for reduced motion changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches)
    }
    motionQuery.addEventListener('change', handleMotionChange)

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  // Mouse move handler
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2

      rawStateRef.current.x = (e.clientX - centerX) / centerX
      rawStateRef.current.y = (e.clientY - centerY) / centerY
      rawStateRef.current.rawX = e.clientX
      rawStateRef.current.rawY = e.clientY
      rawStateRef.current.isActive = true
    }

    const handleMouseLeave = () => {
      rawStateRef.current.isActive = false
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [enabled])

  // Touch move handler (for mobile)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0]
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2

        rawStateRef.current.x = (touch.clientX - centerX) / centerX
        rawStateRef.current.y = (touch.clientY - centerY) / centerY
        rawStateRef.current.rawX = touch.clientX
        rawStateRef.current.rawY = touch.clientY
        rawStateRef.current.isActive = true
      }
    }

    const handleTouchEnd = () => {
      rawStateRef.current.isActive = false
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled])

  // Device orientation handler (gyroscope)
  useEffect(() => {
    if (!enabled || !hasGyroscope || typeof window === 'undefined') return
    if (isReducedMotion) return // Skip gyro if reduced motion preferred

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // beta: front-back tilt (-180 to 180), typically 0-90 when held normally
      // gamma: left-right tilt (-90 to 90)
      if (e.beta !== null && e.gamma !== null) {
        // Normalize gamma (-90 to 90) -> (-1 to 1)
        rawStateRef.current.tiltX = Math.max(
          -1,
          Math.min(1, (e.gamma / 45) * gyroSensitivity)
        )

        // Normalize beta (assuming device held at ~45 degrees)
        // Map 0-90 range centered at 45 to -1 to 1
        rawStateRef.current.tiltY = Math.max(
          -1,
          Math.min(1, ((e.beta - 45) / 45) * gyroSensitivity)
        )
      }
    }

    window.addEventListener('deviceorientation', handleOrientation, {
      passive: true,
    })

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [enabled, hasGyroscope, gyroSensitivity, isReducedMotion])

  // Animation loop for smoothing
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    if (isReducedMotion) {
      // For reduced motion, just set static values
      setState((prev) => ({
        ...prev,
        x: 0,
        y: 0,
        tiltX: 0,
        tiltY: 0,
        velocityX: 0,
        velocityY: 0,
        isActive: false,
        isMobile,
        hasGyroscope,
        isReducedMotion: true,
      }))
      return
    }

    let frameId: number
    let lastTime = performance.now()

    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 16.67, 2) // Normalize to 60fps, cap at 2x
      lastTime = time

      // Store previous values for velocity calculation
      prevRef.current.x = smoothRef.current.x
      prevRef.current.y = smoothRef.current.y

      // Lerp toward target values
      smoothRef.current.x +=
        (rawStateRef.current.x - smoothRef.current.x) * smoothing * delta
      smoothRef.current.y +=
        (rawStateRef.current.y - smoothRef.current.y) * smoothing * delta

      // Apply deadzone
      const x =
        Math.abs(smoothRef.current.x) < deadzone ? 0 : smoothRef.current.x
      const y =
        Math.abs(smoothRef.current.y) < deadzone ? 0 : smoothRef.current.y

      // Calculate velocity
      const velocityX = x - prevRef.current.x
      const velocityY = y - prevRef.current.y

      setState({
        x,
        y,
        rawX: rawStateRef.current.rawX,
        rawY: rawStateRef.current.rawY,
        tiltX: rawStateRef.current.tiltX,
        tiltY: rawStateRef.current.tiltY,
        velocityX,
        velocityY,
        isActive: rawStateRef.current.isActive,
        isMobile,
        hasGyroscope,
        isReducedMotion,
      })

      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [enabled, smoothing, deadzone, isMobile, hasGyroscope, isReducedMotion])

  return state
}

// Convenience hook for combined mouse + gyro position
export function useInteractionPosition(options: UseInteractionOptions = {}) {
  const interaction = useInteraction(options)

  // On mobile with gyroscope, use tilt; otherwise use mouse/touch position
  const x =
    interaction.isMobile && interaction.hasGyroscope
      ? interaction.tiltX
      : interaction.x
  const y =
    interaction.isMobile && interaction.hasGyroscope
      ? interaction.tiltY
      : interaction.y

  return {
    x,
    y,
    rawX: interaction.rawX,
    rawY: interaction.rawY,
    isActive: interaction.isActive,
    isMobile: interaction.isMobile,
    hasGyroscope: interaction.hasGyroscope,
    isReducedMotion: interaction.isReducedMotion,
  }
}
