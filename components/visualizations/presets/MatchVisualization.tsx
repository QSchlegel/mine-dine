'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import P5WebGLWrapper from '../P5WebGLWrapper'
import { ThemeColors } from '../core/types'

interface Particle3D {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  maxLife: number
  size: number
  color: 'coral' | 'gold' | 'white'
  trail: Array<{ x: number; y: number; z: number }>
  stage: 'burst' | 'secondary' | 'falling'
}

interface MatchVisualizationProps {
  isActive: boolean
  userName?: string
  hostName?: string
  userImage?: string | null
  hostImage?: string | null
  onComplete?: () => void
  className?: string
}

// Firework color palette
const FIREWORK_COLORS = {
  coral: {
    primary: 'rgba(255, 127, 80, 1)',
    glow: 'rgba(255, 127, 80, 0.5)',
  },
  gold: {
    primary: 'rgba(255, 215, 0, 1)',
    glow: 'rgba(255, 215, 0, 0.5)',
  },
  white: {
    primary: 'rgba(255, 255, 255, 1)',
    glow: 'rgba(255, 255, 255, 0.5)',
  },
}

export default function MatchVisualization({
  isActive,
  userName,
  hostName,
  userImage,
  hostImage,
  onComplete,
  className = '',
}: MatchVisualizationProps) {
  const particlesRef = useRef<Particle3D[]>([])
  const startTimeRef = useRef<number>(0)
  const hasExplodedRef = useRef(false)
  const [showText, setShowText] = useState(false)

  // Reset when becoming active
  useEffect(() => {
    if (isActive) {
      particlesRef.current = []
      hasExplodedRef.current = false
      startTimeRef.current = performance.now()
      setShowText(false)

      // Show text after initial burst settles
      setTimeout(() => setShowText(true), 500)

      // Trigger completion after animation
      const timer = setTimeout(() => {
        onComplete?.()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isActive, onComplete])

  const createBurst = useCallback((
    originX: number,
    originY: number,
    originZ: number,
    count: number,
    minSpeed: number,
    maxSpeed: number,
    stage: 'burst' | 'secondary' = 'burst'
  ) => {
    const particles: Particle3D[] = []
    const colors: Array<'coral' | 'gold' | 'white'> = ['coral', 'gold', 'white']

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed)

      particles.push({
        x: originX,
        y: originY,
        z: originZ,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed,
        vz: Math.cos(phi) * speed,
        life: 1,
        maxLife: 1,
        size: stage === 'burst' ? 3 + Math.random() * 5 : 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: [],
        stage,
      })
    }

    return particles
  }, [])

  const handleSetup = useCallback((p: any) => {
    particlesRef.current = []
    hasExplodedRef.current = false
  }, [])

  const handleDraw = useCallback((
    p: any,
    colors: ThemeColors,
    _camera: any,
    deltaTime: number
  ) => {
    if (!isActive) {
      // Clear particles when not active
      particlesRef.current = []
      hasExplodedRef.current = false
      return
    }

    const elapsed = (performance.now() - startTimeRef.current) / 1000

    // Initial explosion
    if (!hasExplodedRef.current && elapsed > 0.1) {
      hasExplodedRef.current = true

      // Main burst from center
      const newParticles = createBurst(0, 0, 0, 500, 8, 20, 'burst')
      particlesRef.current.push(...newParticles)
    }

    // Update particles
    const gravity = 0.15
    const airResistance = 0.98
    const newParticles: Particle3D[] = []

    for (const particle of particlesRef.current) {
      // Update trail
      particle.trail.unshift({ x: particle.x, y: particle.y, z: particle.z })
      if (particle.trail.length > 8) {
        particle.trail.pop()
      }

      // Apply physics
      particle.vy += gravity * deltaTime * 60 // Gravity (downward)
      particle.vx *= airResistance
      particle.vy *= airResistance
      particle.vz *= airResistance

      // Update position
      particle.x += particle.vx * deltaTime * 60
      particle.y += particle.vy * deltaTime * 60
      particle.z += particle.vz * deltaTime * 60

      // Decrease life
      const lifeDecay = particle.stage === 'burst' ? 0.008 : 0.015
      particle.life -= lifeDecay * deltaTime * 60

      // Secondary burst when particles reach apex
      if (
        particle.stage === 'burst' &&
        particle.life > 0.3 &&
        particle.life < 0.35 &&
        Math.random() < 0.1
      ) {
        const secondary = createBurst(
          particle.x,
          particle.y,
          particle.z,
          5,
          2,
          5,
          'secondary'
        )
        newParticles.push(...secondary)
        particle.stage = 'falling'
      }
    }

    // Add new particles
    particlesRef.current.push(...newParticles)

    // Remove dead particles
    particlesRef.current = particlesRef.current.filter(p => p.life > 0)

    // Draw particles
    p.blendMode(p.ADD) // Additive blending for glow effect

    for (const particle of particlesRef.current) {
      const colorSet = FIREWORK_COLORS[particle.color]
      const opacity = particle.life

      // Draw trail
      for (let i = 0; i < particle.trail.length; i++) {
        const t = particle.trail[i]
        const trailOpacity = opacity * (1 - i / particle.trail.length) * 0.5
        const trailSize = particle.size * (1 - i / particle.trail.length) * 0.7

        p.push()
        p.translate(t.x, t.y, t.z)
        p.noStroke()
        const trailColor = colorSet.glow.replace(/[\d.]+\)$/, `${trailOpacity})`)
        p.fill(trailColor)
        p.sphere(trailSize)
        p.pop()
      }

      // Draw particle with glow
      p.push()
      p.translate(particle.x, particle.y, particle.z)

      // Outer glow
      p.noStroke()
      const glowColor = colorSet.glow.replace(/[\d.]+\)$/, `${opacity * 0.5})`)
      p.fill(glowColor)
      p.sphere(particle.size * 2)

      // Core
      const coreColor = colorSet.primary.replace(/[\d.]+\)$/, `${opacity})`)
      p.fill(coreColor)
      p.sphere(particle.size)

      // Sparkle effect (random bright flash)
      if (Math.random() < 0.05 && particle.life > 0.5) {
        p.fill('rgba(255, 255, 255, 0.9)')
        p.sphere(particle.size * 0.5)
      }

      p.pop()
    }

    p.blendMode(p.BLEND) // Reset blend mode

    // Draw particle count for debugging (remove in production)
    // p.push()
    // p.resetMatrix()
    // p.fill(255)
    // p.text(`Particles: ${particlesRef.current.length}`, 20, 20)
    // p.pop()
  }, [isActive, createBurst])

  if (!isActive) return null

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* P5 Canvas */}
      <P5WebGLWrapper
        onSetup={handleSetup}
        onDraw={handleDraw}
        enableOrbitControls={false}
        enableGlow={true}
        targetFPS={60}
        is3D={true}
      />

      {/* Match content overlay */}
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {/* Profile images */}
          <div className="flex items-center gap-8 mb-8">
            {/* User image */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg animate-pulse">
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userImage}
                    alt={userName || 'You'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                    {userName?.charAt(0) || 'Y'}
                  </div>
                )}
              </div>
            </div>

            {/* Heart icon */}
            <div className="text-5xl animate-bounce">💖</div>

            {/* Host image */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg animate-pulse">
                {hostImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hostImage}
                    alt={hostName || 'Host'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-2xl font-bold">
                    {hostName?.charAt(0) || 'H'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match text */}
          <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg animate-pulse">
            It&apos;s a Match!
          </h2>
          <p className="text-lg text-white/80">
            You and {hostName || 'this host'} liked each other
          </p>

          {/* CTA buttons */}
          <div className="flex gap-4 mt-8 pointer-events-auto">
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
            >
              Keep Swiping
            </button>
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors"
            >
              Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
