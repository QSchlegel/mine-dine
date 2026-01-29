'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'

export default function MeshGradientBackground() {
  const { resolvedTheme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Theme colors
    const colors = resolvedTheme === 'dark'
      ? [
          { r: 240, g: 131, b: 151 }, // primary pink
          { r: 46, g: 196, b: 182 },  // accent teal
          { r: 246, g: 196, b: 83 },  // secondary amber
        ]
      : [
          { r: 232, g: 93, b: 117 },  // primary pink
          { r: 13, g: 148, b: 136 },   // accent teal
          { r: 217, g: 119, b: 6 },   // secondary amber
        ]

    // Create control points for mesh
    const points: Array<{ x: number; y: number; color: { r: number; g: number; b: number }; vx: number; vy: number }> = []
    const numPoints = 6

    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        color: colors[i % colors.length],
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      })
    }

    let animationFrame: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update point positions
      points.forEach((point) => {
        point.x += point.vx
        point.y += point.vy

        // Bounce off edges
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1

        // Keep in bounds
        point.x = Math.max(0, Math.min(canvas.width, point.x))
        point.y = Math.max(0, Math.min(canvas.height, point.y))
      })

      // Create gradient mesh using Delaunay-like approach (simplified)
      const resolution = 50
      const cellWidth = canvas.width / resolution
      const cellHeight = canvas.height / resolution

      for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
          const px = x * cellWidth
          const py = y * cellHeight

          // Find closest points and blend colors
          let totalWeight = 0
          let r = 0
          let g = 0
          let b = 0

          points.forEach((point) => {
            const dx = px - point.x
            const dy = py - point.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const weight = 1 / (1 + distance * 0.01) // Inverse distance weighting

            r += point.color.r * weight
            g += point.color.g * weight
            b += point.color.b * weight
            totalWeight += weight
          })

          // Normalize
          r /= totalWeight
          g /= totalWeight
          b /= totalWeight

          // Apply opacity based on theme
          const opacity = resolvedTheme === 'dark' ? 0.12 : 0.08

          ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${opacity})`
          ctx.fillRect(px, py, cellWidth, cellHeight)
        }
      }

      animationFrame = requestAnimationFrame(draw)
    }

    // Throttle animation for performance
    let lastTime = 0
    const throttle = 16 // ~60fps

    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= throttle) {
        draw()
        lastTime = currentTime
      }
      animationFrame = requestAnimationFrame(animate)
    }

    animate(0)

    // Pause when tab is hidden
    let isPaused = false
    const handleVisibilityChange = () => {
      isPaused = document.hidden
      if (!isPaused) {
        animate(performance.now())
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [resolvedTheme])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  )
}
