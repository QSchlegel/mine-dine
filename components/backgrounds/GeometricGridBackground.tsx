'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'

export default function GeometricGridBackground() {
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
          grid: 'rgba(243, 241, 238, 0.08)',
          accent1: 'rgba(240, 131, 151, 0.15)',
          accent2: 'rgba(46, 196, 182, 0.15)',
          accent3: 'rgba(246, 196, 83, 0.12)',
        }
      : {
          grid: 'rgba(26, 22, 20, 0.06)',
          accent1: 'rgba(232, 93, 117, 0.1)',
          accent2: 'rgba(13, 148, 136, 0.1)',
          accent3: 'rgba(217, 119, 6, 0.08)',
        }

    const gridSize = 60
    const cellSize = gridSize
    let time = 0
    let animationFrame: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      time += 0.01

      // Draw grid
      ctx.strokeStyle = colors.grid
      ctx.lineWidth = 1

      for (let x = 0; x < canvas.width; x += cellSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += cellSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw animated geometric shapes
      const shapes = [
        { x: canvas.width * 0.2, y: canvas.height * 0.3, color: colors.accent1, size: 40 },
        { x: canvas.width * 0.8, y: canvas.height * 0.2, color: colors.accent2, size: 50 },
        { x: canvas.width * 0.5, y: canvas.height * 0.7, color: colors.accent3, size: 45 },
        { x: canvas.width * 0.15, y: canvas.height * 0.8, color: colors.accent1, size: 35 },
        { x: canvas.width * 0.85, y: canvas.height * 0.6, color: colors.accent2, size: 42 },
      ]

      shapes.forEach((shape, index) => {
        const offsetX = Math.sin(time + index) * 20
        const offsetY = Math.cos(time * 0.7 + index) * 15
        const scale = 1 + Math.sin(time * 0.5 + index) * 0.2

        ctx.save()
        ctx.translate(shape.x + offsetX, shape.y + offsetY)
        ctx.scale(scale, scale)
        ctx.fillStyle = shape.color
        ctx.globalAlpha = 0.6

        // Draw hexagon
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i
          const x = Math.cos(angle) * shape.size
          const y = Math.sin(angle) * shape.size
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()
        ctx.fill()

        ctx.restore()
      })

      // Draw connecting lines between shapes
      ctx.strokeStyle = colors.accent1
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.3

      for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
          const dist = Math.sqrt(
            Math.pow(shapes[i].x - shapes[j].x, 2) + 
            Math.pow(shapes[i].y - shapes[j].y, 2)
          )
          
          if (dist < 300) {
            const offsetI = {
              x: Math.sin(time + i) * 20,
              y: Math.cos(time * 0.7 + i) * 15,
            }
            const offsetJ = {
              x: Math.sin(time + j) * 20,
              y: Math.cos(time * 0.7 + j) * 15,
            }
            
            ctx.beginPath()
            ctx.moveTo(shapes[i].x + offsetI.x, shapes[i].y + offsetI.y)
            ctx.lineTo(shapes[j].x + offsetJ.x, shapes[j].y + offsetJ.y)
            ctx.stroke()
          }
        }
      }

      ctx.globalAlpha = 1
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
