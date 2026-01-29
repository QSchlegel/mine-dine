'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'

export default function RadialGradientBackground() {
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion || !containerRef.current) return

    const container = containerRef.current

    // Theme colors
    const colors = resolvedTheme === 'dark'
      ? [
          'rgba(240, 131, 151, 0.15)',
          'rgba(46, 196, 182, 0.12)',
          'rgba(246, 196, 83, 0.1)',
          'rgba(240, 131, 151, 0.08)',
        ]
      : [
          'rgba(232, 93, 117, 0.12)',
          'rgba(13, 148, 136, 0.1)',
          'rgba(217, 119, 6, 0.08)',
          'rgba(232, 93, 117, 0.06)',
        ]

    // Create gradient orbs
    const orbs: Array<{
      element: HTMLDivElement
      x: number
      y: number
      size: number
      vx: number
      vy: number
      pulseSpeed: number
      pulsePhase: number
    }> = []

    const numOrbs = 4

    for (let i = 0; i < numOrbs; i++) {
      const orb = document.createElement('div')
      const size = 200 + Math.random() * 300
      const x = Math.random() * window.innerWidth
      const y = Math.random() * window.innerHeight

      orb.style.position = 'absolute'
      orb.style.width = `${size}px`
      orb.style.height = `${size}px`
      orb.style.borderRadius = '50%'
      orb.style.background = `radial-gradient(circle, ${colors[i % colors.length]}, transparent 70%)`
      orb.style.filter = 'blur(60px)'
      orb.style.transform = `translate(-50%, -50%)`
      orb.style.left = `${x}px`
      orb.style.top = `${y}px`
      orb.style.pointerEvents = 'none'
      orb.style.willChange = 'transform, opacity'

      container.appendChild(orb)

      orbs.push({
        element: orb,
        x,
        y,
        size,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        pulseSpeed: 0.5 + Math.random() * 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
      })
    }

    let animationFrame: number
    let startTime = Date.now()

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000

      orbs.forEach((orb) => {
        // Update position
        orb.x += orb.vx
        orb.y += orb.vy

        // Bounce off edges
        if (orb.x < 0 || orb.x > window.innerWidth) orb.vx *= -1
        if (orb.y < 0 || orb.y > window.innerHeight) orb.vy *= -1

        // Keep in bounds
        orb.x = Math.max(0, Math.min(window.innerWidth, orb.x))
        orb.y = Math.max(0, Math.min(window.innerHeight, orb.y))

        // Pulsing effect
        const pulse = 1 + Math.sin(elapsed * orb.pulseSpeed + orb.pulsePhase) * 0.2
        const currentSize = orb.size * pulse

        orb.element.style.left = `${orb.x}px`
        orb.element.style.top = `${orb.y}px`
        orb.element.style.width = `${currentSize}px`
        orb.element.style.height = `${currentSize}px`
      })

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      orbs.forEach((orb) => {
        orb.x = Math.min(orb.x, window.innerWidth)
        orb.y = Math.min(orb.y, window.innerHeight)
      })
    }
    window.addEventListener('resize', handleResize)

    // Pause when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame)
      } else {
        startTime = Date.now() - (Date.now() - startTime)
        animate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      orbs.forEach((orb) => {
        if (container.contains(orb.element)) {
          container.removeChild(orb.element)
        }
      })
    }
  }, [resolvedTheme])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
      aria-hidden="true"
    />
  )
}
