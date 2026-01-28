'use client'

import confetti from 'canvas-confetti'
import { useCallback, useMemo } from 'react'

// Brand colors from tailwind config
const BRAND_COLORS = ['#EC4899', '#06B6D4', '#FFD700'] // coral, cyan, gold

export function useConfetti() {
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Basic confetti burst
  const fireConfetti = useCallback((options?: confetti.Options) => {
    if (prefersReducedMotion) return

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: BRAND_COLORS,
      ...options,
    })
  }, [prefersReducedMotion])

  // Match celebration - dual sided burst
  const fireMatchCelebration = useCallback(() => {
    if (prefersReducedMotion) return

    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      // Left side burst
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: BRAND_COLORS,
      })

      // Right side burst
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: BRAND_COLORS,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [prefersReducedMotion])

  // Booking celebration - school pride style
  const fireBookingCelebration = useCallback(() => {
    if (prefersReducedMotion) return

    const count = 200
    const defaults = { origin: { y: 0.7 }, colors: BRAND_COLORS }

    function fire(particleRatio: number, opts: Partial<confetti.Options>) {
      confetti({
        ...defaults,
        particleCount: Math.floor(count * particleRatio),
        ...opts,
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }, [prefersReducedMotion])

  // Emoji burst
  const fireEmoji = useCallback((emoji: string = '🎉') => {
    if (prefersReducedMotion) return

    const scalar = 2
    const emojiShape = confetti.shapeFromText({ text: emoji, scalar })

    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 },
      shapes: [emojiShape],
      scalar,
    })
  }, [prefersReducedMotion])

  // Hearts burst for matches
  const fireHearts = useCallback(() => {
    if (prefersReducedMotion) return

    const scalar = 2
    const heart = confetti.shapeFromText({ text: '💖', scalar })
    const sparkle = confetti.shapeFromText({ text: '✨', scalar })

    confetti({
      particleCount: 20,
      spread: 80,
      origin: { y: 0.5 },
      shapes: [heart, sparkle],
      scalar,
    })
  }, [prefersReducedMotion])

  // Subtle success burst
  const fireSuccess = useCallback(() => {
    if (prefersReducedMotion) return

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#22C55E', '#10B981', '#34D399'], // green shades
      gravity: 1.2,
    })
  }, [prefersReducedMotion])

  return {
    fireConfetti,
    fireMatchCelebration,
    fireBookingCelebration,
    fireEmoji,
    fireHearts,
    fireSuccess,
    prefersReducedMotion,
  }
}
