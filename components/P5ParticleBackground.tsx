'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from './ThemeProvider'
import { InteractionState } from '@/hooks/useInteraction'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

export type CursorMode = 'repel' | 'attract' | 'vortex'

interface P5ParticleBackgroundProps {
  className?: string
  interactionState?: InteractionState
  cursorMode?: CursorMode
  gyroInfluence?: number // 0-1, how much gyroscope affects flow (default: 0.3)
}

export default function P5ParticleBackground({
  className = '',
  interactionState,
  cursorMode = 'repel',
  gyroInfluence = 0.3,
}: P5ParticleBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<any>(null)
  const [shouldRender, setShouldRender] = useState(false)
  const { resolvedTheme } = useTheme()

  // Store interaction state in ref for use inside p5 sketch
  const interactionRef = useRef<InteractionState | undefined>(interactionState)
  const cursorModeRef = useRef<CursorMode>(cursorMode)
  const gyroInfluenceRef = useRef<number>(gyroInfluence)

  // Update refs when props change
  useEffect(() => {
    interactionRef.current = interactionState
  }, [interactionState])

  useEffect(() => {
    cursorModeRef.current = cursorMode
  }, [cursorMode])

  useEffect(() => {
    gyroInfluenceRef.current = gyroInfluence
  }, [gyroInfluence])

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    // Check device capabilities
    const isLowEndDevice =
      navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4

    // Skip animation on low-end devices or if reduced motion is preferred
    if (prefersReducedMotion || isLowEndDevice) {
      return
    }

    // Only render on client side
    if (typeof window === 'undefined') {
      return
    }

    let mounted = true
    let isPaused = false

    // Dynamically import p5
    const initP5 = async () => {
      try {
        const p5Module = await import('p5')
        const p5Constructor = p5Module.default || p5Module
        if (!p5Constructor) {
          console.warn('p5 constructor not found')
          return
        }

        if (!mounted || !containerRef.current) return

        const container = containerRef.current

        // Determine particle count based on screen size and device capabilities
        const getParticleCount = () => {
          const width = window.innerWidth
          const cores = navigator.hardwareConcurrency || 4

          if (width < 640) {
            return Math.min(60, cores * 15)
          } else if (width < 1024) {
            return Math.min(100, cores * 20)
          } else {
            return Math.min(150, cores * 25)
          }
        }

        let particles: Particle[] = []
        let mouseX = 0
        let mouseY = 0
        let touchX = 0
        let touchY = 0
        let isTouching = false

        // Color palette based on theme
        const getColors = () => {
          if (resolvedTheme === 'dark') {
            return {
              background: [15, 23, 42],
              particle: 'rgba(251, 191, 36, 0.4)',
              connection: 'rgba(251, 146, 60, 0.15)',
              accent: 'rgba(255, 127, 80, 0.3)',
            }
          } else {
            return {
              background: [255, 251, 235],
              particle: 'rgba(245, 158, 11, 0.5)',
              connection: 'rgba(249, 115, 22, 0.2)',
              accent: 'rgba(255, 127, 80, 0.4)',
            }
          }
        }

        const sketch = (p: any) => {
          let colors = getColors()
          let particleCount = getParticleCount()
          const connectionDistance = 120
          const repulsionRadius = 150
          const repulsionStrength = 0.02

          // Get interaction position combining mouse/touch and gyroscope
          const getInteractionPosition = () => {
            const interaction = interactionRef.current

            if (interaction && interaction.hasGyroscope && interaction.isMobile) {
              // On mobile with gyroscope: use tilt to create a virtual interaction point
              return {
                x: p.width / 2 + interaction.tiltX * p.width * 0.4,
                y: p.height / 2 + interaction.tiltY * p.height * 0.4,
                strength: 0.8,
              }
            } else if (interaction && interaction.isActive) {
              // Desktop: use raw mouse position from interaction state
              return {
                x: interaction.rawX,
                y: interaction.rawY,
                strength: 1,
              }
            } else {
              // Fallback to internal mouse/touch tracking
              return {
                x: isTouching ? touchX : mouseX,
                y: isTouching ? touchY : mouseY,
                strength: isTouching || mouseX !== 0 || mouseY !== 0 ? 1 : 0,
              }
            }
          }

          // Apply cursor effect based on mode
          const applyCursorEffect = (
            particle: Particle,
            cursorPos: { x: number; y: number; strength: number }
          ) => {
            const dx = cursorPos.x - particle.x
            const dy = cursorPos.y - particle.y
            const distance = p.sqrt(dx * dx + dy * dy)

            if (distance < repulsionRadius && distance > 0 && cursorPos.strength > 0) {
              const force =
                ((repulsionRadius - distance) / repulsionRadius) * cursorPos.strength
              const angle = p.atan2(dy, dx)
              const mode = cursorModeRef.current

              switch (mode) {
                case 'repel':
                  particle.vx -= p.cos(angle) * force * repulsionStrength
                  particle.vy -= p.sin(angle) * force * repulsionStrength
                  break
                case 'attract':
                  particle.vx += p.cos(angle) * force * repulsionStrength * 0.5
                  particle.vy += p.sin(angle) * force * repulsionStrength * 0.5
                  break
                case 'vortex':
                  // Perpendicular force for swirl effect
                  particle.vx += p.sin(angle) * force * repulsionStrength
                  particle.vy -= p.cos(angle) * force * repulsionStrength
                  break
              }
            }
          }

          // Apply gyroscope influence on all particles
          const applyGyroscopeToFlow = () => {
            const interaction = interactionRef.current
            if (
              interaction &&
              interaction.hasGyroscope &&
              interaction.isMobile &&
              gyroInfluenceRef.current > 0
            ) {
              const influence = gyroInfluenceRef.current
              for (const particle of particles) {
                // Tilt affects particle drift
                particle.vx += interaction.tiltX * influence * 0.05
                particle.vy += interaction.tiltY * influence * 0.05
              }
            }
          }

          p.setup = () => {
            const width = container.offsetWidth || window.innerWidth
            const height = container.offsetHeight || window.innerHeight
            const canvas = p.createCanvas(width, height)
            canvas.parent(container)

            // Performance optimizations for mobile
            if (window.innerWidth < 1024) {
              p.pixelDensity(1)
              p.frameRate(30)
            } else {
              p.pixelDensity(window.devicePixelRatio || 1)
              p.frameRate(60)
            }

            // Initialize particles
            particles = []
            for (let i = 0; i < particleCount; i++) {
              particles.push({
                x: p.random(p.width),
                y: p.random(p.height),
                vx: p.random(-0.5, 0.5),
                vy: p.random(-0.5, 0.5),
                radius: p.random(2, 4),
                color: colors.particle,
              })
            }

            canvas.elt.style.pointerEvents = 'none'
          }

          p.draw = () => {
            if (isPaused) return

            colors = getColors()
            p.background(
              colors.background[0],
              colors.background[1],
              colors.background[2]
            )

            // Get current interaction position
            const interactionPos = getInteractionPosition()

            // Apply gyroscope influence on flow
            applyGyroscopeToFlow()

            for (let i = 0; i < particles.length; i++) {
              const particle = particles[i]

              // Apply noise-based flow field for organic movement
              const noiseScale = 0.01
              const noiseX = p.noise(
                particle.x * noiseScale,
                particle.y * noiseScale,
                p.frameCount * 0.001
              )
              const noiseY = p.noise(
                particle.x * noiseScale,
                particle.y * noiseScale,
                p.frameCount * 0.001 + 1000
              )

              const flowX = p.map(noiseX, 0, 1, -0.3, 0.3)
              const flowY = p.map(noiseY, 0, 1, -0.3, 0.3)

              // Apply cursor effect
              applyCursorEffect(particle, interactionPos)

              // Apply flow field
              particle.vx += flowX * 0.1
              particle.vy += flowY * 0.1

              // Apply damping
              particle.vx *= 0.98
              particle.vy *= 0.98

              // Update position
              particle.x += particle.vx
              particle.y += particle.vy

              // Wrap around edges
              if (particle.x < 0) particle.x = p.width
              if (particle.x > p.width) particle.x = 0
              if (particle.y < 0) particle.y = p.height
              if (particle.y > p.height) particle.y = 0

              // Draw particle
              p.fill(colors.particle)
              p.noStroke()
              p.circle(particle.x, particle.y, particle.radius * 2)
            }

            // Draw connections between nearby particles
            p.stroke(colors.connection)
            p.strokeWeight(1)

            for (let i = 0; i < particles.length; i++) {
              for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x
                const dy = particles[i].y - particles[j].y
                const distance = p.sqrt(dx * dx + dy * dy)

                if (distance < connectionDistance) {
                  const opacity = p.map(distance, 0, connectionDistance, 0.3, 0)
                  const connectionColor = colors.connection.replace(
                    /0\.\d+/,
                    opacity.toString()
                  )
                  p.stroke(connectionColor)
                  p.line(
                    particles[i].x,
                    particles[i].y,
                    particles[j].x,
                    particles[j].y
                  )
                }
              }
            }
          }

          p.windowResized = () => {
            const width = container.offsetWidth || window.innerWidth
            const height = container.offsetHeight || window.innerHeight
            p.resizeCanvas(width, height)

            const newCount = getParticleCount()
            if (newCount !== particles.length) {
              const diff = newCount - particles.length
              if (diff > 0) {
                for (let i = 0; i < diff; i++) {
                  particles.push({
                    x: p.random(p.width),
                    y: p.random(p.height),
                    vx: p.random(-0.5, 0.5),
                    vy: p.random(-0.5, 0.5),
                    radius: p.random(2, 4),
                    color: colors.particle,
                  })
                }
              } else {
                particles = particles.slice(0, newCount)
              }
            }

            if (window.innerWidth < 1024) {
              p.pixelDensity(1)
              p.frameRate(30)
            } else {
              p.pixelDensity(window.devicePixelRatio || 1)
              p.frameRate(60)
            }
          }

          // Internal mouse tracking (fallback when no interactionState prop)
          p.mouseMoved = () => {
            mouseX = p.mouseX
            mouseY = p.mouseY
            isTouching = false
          }

          p.touchMoved = (e: any) => {
            if (e.touches && e.touches.length > 0) {
              touchX = e.touches[0].clientX
              touchY = e.touches[0].clientY
              isTouching = true
            }
            return false
          }

          p.touchStarted = (e: any) => {
            if (e.touches && e.touches.length > 0) {
              touchX = e.touches[0].clientX
              touchY = e.touches[0].clientY
              isTouching = true
            }
            return false
          }

          p.touchEnded = () => {
            isTouching = false
          }
        }

        if (!mounted || !containerRef.current) return

        try {
          setShouldRender(true)
          p5InstanceRef.current = new p5Constructor(sketch, containerRef.current)
        } catch (error) {
          console.error('Failed to initialize p5 animation:', error)
          setShouldRender(false)
        }
      } catch (error) {
        console.error('Failed to load p5.js:', error)
      }
    }

    initP5()

    const handleVisibilityChange = () => {
      isPaused = document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const handleOrientationChange = () => {
      setTimeout(() => {
        if (p5InstanceRef.current && containerRef.current) {
          p5InstanceRef.current.resizeCanvas(
            containerRef.current.offsetWidth,
            containerRef.current.offsetHeight
          )
        }
      }, 100)
    }
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      mounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('orientationchange', handleOrientationChange)

      if (p5InstanceRef.current) {
        try {
          p5InstanceRef.current.remove()
        } catch {
          // Ignore errors during cleanup
        }
        p5InstanceRef.current = null
      }
    }
  }, [resolvedTheme])

  if (!shouldRender) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      }}
      aria-hidden="true"
    />
  )
}
