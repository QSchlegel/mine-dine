'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TrailPoint {
  x: number
  y: number
  id: number
}

interface CustomCursorProps {
  enabled?: boolean
  color?: string // CSS color value
  trailLength?: number
  cursorSize?: number
}

export default function CustomCursor({
  enabled = true,
  color = 'rgb(236, 72, 153)', // pink-500
  trailLength = 6,
  cursorSize = 12,
}: CustomCursorProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [trail, setTrail] = useState<TrailPoint[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  const idRef = useRef(0)
  const lastPositionRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>()

  // Detect mobile and reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || 'ontouchstart' in window

    setIsMobile(mobile)

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    setIsReducedMotion(prefersReducedMotion)
  }, [])

  // Handle mouse movement
  useEffect(() => {
    if (!enabled || isMobile || isReducedMotion) return
    if (typeof window === 'undefined') return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX
      const newY = e.clientY

      setPosition({ x: newX, y: newY })

      // Only add to trail if moved enough
      const dx = newX - lastPositionRef.current.x
      const dy = newY - lastPositionRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 5) {
        lastPositionRef.current = { x: newX, y: newY }

        setTrail((prev) => {
          const newTrail = [
            { x: newX, y: newY, id: idRef.current++ },
            ...prev.slice(0, trailLength - 1),
          ]
          return newTrail
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [enabled, isMobile, isReducedMotion, trailLength])

  // Handle visibility
  useEffect(() => {
    if (!enabled || isMobile || isReducedMotion) return
    if (typeof window === 'undefined') return

    const show = () => setIsVisible(true)
    const hide = () => setIsVisible(false)

    document.addEventListener('mouseenter', show)
    document.addEventListener('mouseleave', hide)

    // Also track when entering/leaving the window
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setIsVisible(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('mouseenter', show)
      document.removeEventListener('mouseleave', hide)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [enabled, isMobile, isReducedMotion])

  // Handle mouse press state
  useEffect(() => {
    if (!enabled || isMobile || isReducedMotion) return
    if (typeof window === 'undefined') return

    const handleMouseDown = () => setIsPressed(true)
    const handleMouseUp = () => setIsPressed(false)

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [enabled, isMobile, isReducedMotion])

  // Hide native cursor
  useEffect(() => {
    if (!enabled || isMobile || isReducedMotion) return
    if (typeof document === 'undefined') return

    // Add style to hide cursor on interactive elements
    const style = document.createElement('style')
    style.id = 'custom-cursor-hide'
    style.textContent = `
      * {
        cursor: none !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById('custom-cursor-hide')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [enabled, isMobile, isReducedMotion])

  // Don't render on mobile, reduced motion, or when disabled
  if (!enabled || isMobile || isReducedMotion) {
    return null
  }

  const halfSize = cursorSize / 2
  const ringSize = cursorSize * 2.5

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Trail dots */}
            {trail.map((point, i) => (
              <motion.div
                key={point.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 0.4 * (1 - i / trailLength),
                  scale: 0.8 - (i / trailLength) * 0.5,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute rounded-full"
                style={{
                  left: point.x - halfSize * 0.5,
                  top: point.y - halfSize * 0.5,
                  width: cursorSize * 0.5,
                  height: cursorSize * 0.5,
                  backgroundColor: color,
                }}
              />
            ))}

            {/* Main cursor dot with glow */}
            <motion.div
              className="absolute rounded-full"
              style={{
                left: position.x - halfSize,
                top: position.y - halfSize,
                width: cursorSize,
                height: cursorSize,
                backgroundColor: color,
                boxShadow: `0 0 20px ${color}, 0 0 40px ${color}40`,
              }}
              animate={{
                scale: isPressed ? 0.8 : 1,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />

            {/* Outer ring */}
            <motion.div
              className="absolute rounded-full border-2"
              style={{
                left: position.x - ringSize / 2,
                top: position.y - ringSize / 2,
                width: ringSize,
                height: ringSize,
                borderColor: color,
                opacity: 0.5,
              }}
              animate={{
                scale: isPressed ? 0.9 : [1, 1.1, 1],
                opacity: isPressed ? 0.8 : 0.5,
              }}
              transition={
                isPressed
                  ? { type: 'spring', stiffness: 500, damping: 30 }
                  : {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
            />

            {/* Click ripple effect */}
            <AnimatePresence>
              {isPressed && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    left: position.x - ringSize,
                    top: position.y - ringSize,
                    width: ringSize * 2,
                    height: ringSize * 2,
                    border: `1px solid ${color}`,
                  }}
                  initial={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
