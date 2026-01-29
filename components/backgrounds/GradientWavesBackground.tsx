'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'

export default function GradientWavesBackground() {
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion || !containerRef.current) return

    const container = containerRef.current

    // Create SVG for gradient waves
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 1200 800')
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice')
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.position = 'absolute'
    svg.style.top = '0'
    svg.style.left = '0'

    // Define gradients based on theme
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    
    // Primary gradient
    const gradient1 = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
    gradient1.setAttribute('id', 'gradient1')
    gradient1.setAttribute('x1', '0%')
    gradient1.setAttribute('y1', '0%')
    gradient1.setAttribute('x2', '100%')
    gradient1.setAttribute('y2', '100%')
    
    if (resolvedTheme === 'dark') {
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop1.setAttribute('offset', '0%')
      stop1.setAttribute('stop-color', 'rgba(240, 131, 151, 0.15)')
      gradient1.appendChild(stop1)
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop2.setAttribute('offset', '100%')
      stop2.setAttribute('stop-color', 'rgba(46, 196, 182, 0.15)')
      gradient1.appendChild(stop2)
    } else {
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop1.setAttribute('offset', '0%')
      stop1.setAttribute('stop-color', 'rgba(232, 93, 117, 0.1)')
      gradient1.appendChild(stop1)
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop2.setAttribute('offset', '100%')
      stop2.setAttribute('stop-color', 'rgba(13, 148, 136, 0.1)')
      gradient1.appendChild(stop2)
    }
    defs.appendChild(gradient1)

    // Secondary gradient
    const gradient2 = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
    gradient2.setAttribute('id', 'gradient2')
    gradient2.setAttribute('x1', '100%')
    gradient2.setAttribute('y1', '0%')
    gradient2.setAttribute('x2', '0%')
    gradient2.setAttribute('y2', '100%')
    
    if (resolvedTheme === 'dark') {
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop1.setAttribute('offset', '0%')
      stop1.setAttribute('stop-color', 'rgba(246, 196, 83, 0.12)')
      gradient2.appendChild(stop1)
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop2.setAttribute('offset', '100%')
      stop2.setAttribute('stop-color', 'rgba(240, 131, 151, 0.12)')
      gradient2.appendChild(stop2)
    } else {
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop1.setAttribute('offset', '0%')
      stop1.setAttribute('stop-color', 'rgba(217, 119, 6, 0.08)')
      gradient2.appendChild(stop1)
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop2.setAttribute('offset', '100%')
      stop2.setAttribute('stop-color', 'rgba(232, 93, 117, 0.08)')
      gradient2.appendChild(stop2)
    }
    defs.appendChild(gradient2)

    svg.appendChild(defs)

    // Create wave paths
    const createWave = (id: string, gradientId: string, y: number, amplitude: number, frequency: number, phase: number) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('id', id)
      path.setAttribute('fill', `url(#${gradientId})`)
      path.setAttribute('opacity', '0.6')
      
      // Generate wave path
      let pathData = `M 0 ${y}`
      const points = 100
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * 1200
        const waveY = y + Math.sin((i / points) * frequency * Math.PI * 2 + phase) * amplitude
        pathData += ` L ${x} ${waveY}`
      }
      pathData += ` L 1200 800 L 0 800 Z`
      path.setAttribute('d', pathData)
      
      svg.appendChild(path)
      return path
    }

    // Create multiple waves
    const wave1 = createWave('wave1', 'gradient1', 200, 80, 2, 0)
    const wave2 = createWave('wave2', 'gradient2', 400, 60, 1.5, Math.PI / 3)
    const wave3 = createWave('wave3', 'gradient1', 600, 100, 1.2, Math.PI / 2)

    container.appendChild(svg)

    // Animate waves
    let animationFrame: number
    let startTime = Date.now()

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      
      // Update wave paths
      const updateWave = (path: SVGPathElement, y: number, amplitude: number, frequency: number, phase: number) => {
        let pathData = `M 0 ${y}`
        const points = 100
        for (let i = 0; i <= points; i++) {
          const x = (i / points) * 1200
          const waveY = y + Math.sin((i / points) * frequency * Math.PI * 2 + phase + elapsed * 0.5) * amplitude
          pathData += ` L ${x} ${waveY}`
        }
        pathData += ` L 1200 800 L 0 800 Z`
        path.setAttribute('d', pathData)
      }

      updateWave(wave1, 200, 80, 2, 0)
      updateWave(wave2, 400, 60, 1.5, Math.PI / 3)
      updateWave(wave3, 600, 100, 1.2, Math.PI / 2)

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

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
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (container.contains(svg)) {
        container.removeChild(svg)
      }
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
