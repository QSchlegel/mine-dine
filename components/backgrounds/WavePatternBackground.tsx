'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'

export default function WavePatternBackground() {
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
      ? {
          wave1: 'rgba(240, 131, 151, 0.12)',
          wave2: 'rgba(46, 196, 182, 0.1)',
          wave3: 'rgba(246, 196, 83, 0.08)',
        }
      : {
          wave1: 'rgba(232, 93, 117, 0.1)',
          wave2: 'rgba(13, 148, 136, 0.08)',
          wave3: 'rgba(217, 119, 6, 0.06)',
        }

    let time = 0
    let animationFrame: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      time += 0.02

      // Draw multiple horizontal waves
      const waves = [
        { color: colors.wave1, amplitude: 30, frequency: 0.01, speed: 0.5, y: canvas.height * 0.3 },
        { color: colors.wave2, amplitude: 40, frequency: 0.008, speed: 0.3, y: canvas.height * 0.5 },
        { color: colors.wave3, amplitude: 25, frequency: 0.012, speed: 0.4, y: canvas.height * 0.7 },
      ]

      waves.forEach((wave) => {
        ctx.beginPath()
        ctx.moveTo(0, wave.y)

        for (let x = 0; x < canvas.width; x += 2) {
          const y = wave.y + Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude
          ctx.lineTo(x, y)
        }

        ctx.lineTo(canvas.width, canvas.height)
        ctx.lineTo(0, canvas.height)
        ctx.closePath()

        // Create gradient fill
        const gradient = ctx.createLinearGradient(0, wave.y - wave.amplitude, 0, wave.y + wave.amplitude)
        gradient.addColorStop(0, wave.color)
        gradient.addColorStop(0.5, wave.color.replace(/[\d.]+\)$/, '0.15)'))
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.fill()
      })

      animationFrame = requestAnimationFrame(draw)
    }

    draw()

    // Pause when tab is hidden
    let isPaused = false
    const handleVisibilityChange = () => {
      isPaused = document.hidden
      if (!isPaused) {
        draw()
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
