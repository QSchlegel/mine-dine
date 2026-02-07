'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'

const FOOD_EMOJIS = [
  '🍕', '🍔', '🌮', '🍣', '🥗', '🍰', '🧁', '🍷',
  '🥑', '🍝', '🍜', '🥐', '🧀', '🍩', '🫕', '🥘',
  '🍱', '🥂', '🍇', '🫒', '🌶️', '🍋', '🥖', '🍤',
]

interface FoodParticle {
  x: number
  y: number
  emoji: string
  size: number
  speed: number
  wobbleSpeed: number
  wobbleAmount: number
  wobbleOffset: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

export default function FloatingFoodBackground() {
  const { resolvedTheme } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resizeCanvas = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Spawn particles across the full height so it's not empty on load
    const numParticles = Math.min(
      Math.floor((window.innerWidth * window.innerHeight) / 40000),
      30
    )

    const createParticle = (startBelow = false): FoodParticle => ({
      x: Math.random() * window.innerWidth,
      y: startBelow
        ? window.innerHeight + Math.random() * 200
        : Math.random() * window.innerHeight,
      emoji: FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)],
      size: 18 + Math.random() * 22,
      speed: 0.3 + Math.random() * 0.6,
      wobbleSpeed: 0.5 + Math.random() * 1.5,
      wobbleAmount: 15 + Math.random() * 30,
      wobbleOffset: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.015,
      opacity: 0.25 + Math.random() * 0.35,
    })

    const particles: FoodParticle[] = Array.from({ length: numParticles }, () =>
      createParticle(false)
    )

    let animationFrame: number
    let elapsed = 0
    let lastTime = performance.now()
    const baseOpacity = resolvedTheme === 'dark' ? 1 : 0.75

    const draw = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000
      lastTime = currentTime
      elapsed += delta

      const w = window.innerWidth
      const h = window.innerHeight

      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        // Move upward
        p.y -= p.speed * delta * 60
        // Horizontal wobble
        const wobbleX =
          Math.sin(elapsed * p.wobbleSpeed + p.wobbleOffset) * p.wobbleAmount
        // Rotate
        p.rotation += p.rotationSpeed * delta * 60

        // Reset when off top
        if (p.y < -p.size * 2) {
          Object.assign(p, createParticle(true))
        }

        ctx.save()
        ctx.translate(p.x + wobbleX, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.opacity * baseOpacity
        ctx.font = `${p.size}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(p.emoji, 0, 0)
        ctx.restore()
      }

      animationFrame = requestAnimationFrame(draw)
    }

    animationFrame = requestAnimationFrame(draw)

    // Pause when tab hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame)
      } else {
        lastTime = performance.now()
        animationFrame = requestAnimationFrame(draw)
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
