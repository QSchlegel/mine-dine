'use client'

import { useCallback, useRef, useEffect } from 'react'
import P5WebGLWrapper from '../P5WebGLWrapper'
import { OrbitalSystem, createOrbitalSystemFromTags } from '../core/OrbitalSystem'
import { ThemeColors, OrbitalParticle } from '../core/types'

interface TagData {
  id: string
  name: string
  category: string
}

interface DinnerVisualizationProps {
  tags: TagData[]
  dinnerTitle?: string
  isHovered?: boolean
  onTagClick?: (tagId: string) => void
  className?: string
}

// Category colors for constellation lines
const CATEGORY_LINE_COLORS: Record<string, string> = {
  CUISINE: 'rgba(236, 72, 153, 0.4)',
  DIETARY: 'rgba(6, 182, 212, 0.4)',
  INTEREST: 'rgba(251, 191, 36, 0.4)',
  LIFESTYLE: 'rgba(168, 85, 247, 0.4)',
  SKILL: 'rgba(34, 197, 94, 0.4)',
}

export default function DinnerVisualization({
  tags,
  dinnerTitle,
  isHovered = false,
  onTagClick,
  className = '',
}: DinnerVisualizationProps) {
  const orbitalSystemRef = useRef<OrbitalSystem | null>(null)
  const tagsRef = useRef<TagData[]>([])
  const isInitializedRef = useRef(false)
  const colorsRef = useRef<ThemeColors | null>(null)

  // Update tags ref
  useEffect(() => {
    tagsRef.current = tags
    // Reset initialization to rebuild system with new tags
    if (isInitializedRef.current && orbitalSystemRef.current) {
      orbitalSystemRef.current.clear()
      isInitializedRef.current = false
    }
  }, [tags])

  // Handle hover effect
  useEffect(() => {
    if (orbitalSystemRef.current) {
      if (isHovered) {
        orbitalSystemRef.current.scatter(0.5)
      }
    }
  }, [isHovered])

  const handleSetup = useCallback((p: any, colors: ThemeColors) => {
    colorsRef.current = colors

    // Create orbital system
    const system = createOrbitalSystemFromTags(tagsRef.current, colors)
    system.setCenter(p.width / 2, p.height / 2, 0)
    orbitalSystemRef.current = system
    isInitializedRef.current = true
  }, [])

  const handleDraw = useCallback((
    p: any,
    colors: ThemeColors,
    _camera: any,
    deltaTime: number
  ) => {
    const system = orbitalSystemRef.current
    if (!system) return

    // Reinitialize if needed (tags changed)
    if (!isInitializedRef.current && colorsRef.current) {
      const newSystem = createOrbitalSystemFromTags(tagsRef.current, colorsRef.current)
      newSystem.setCenter(p.width / 2, p.height / 2, 0)
      orbitalSystemRef.current = newSystem
      isInitializedRef.current = true
      return
    }

    // Update colors ref
    colorsRef.current = colors

    // Update orbital system
    system.tick(deltaTime * 60)

    const particles = system.getParticles()
    const center = system.getCenter()
    const constellationLines = system.getConstellationLines()

    // Draw central "sun" (dinner)
    const sunX = center.x - p.width / 2
    const sunY = center.y - p.height / 2
    const sunZ = center.z

    p.push()
    p.translate(sunX, sunY, sunZ)

    // Outer glow pulse
    const glowPulse = (Math.sin(p.frameCount * 0.03) + 1) / 2 * 0.2 + 0.2
    p.noStroke()
    p.fill(colors.accent.replace(/[\d.]+\)$/, `${glowPulse})`))
    p.sphere(50)

    // Inner glow
    p.fill(colors.accent.replace(/[\d.]+\)$/, '0.4)'))
    p.sphere(35)

    // Core
    p.fill(colors.accent)
    p.sphere(20)

    p.pop()

    // Draw constellation lines between same-category particles
    for (const line of constellationLines) {
      const { from, to, opacity } = line
      const categoryColor = CATEGORY_LINE_COLORS[from.category] || colors.connection

      // Check if either particle is dimmed
      const fromDimmed = from.data?.dimmed as boolean || false
      const toDimmed = to.data?.dimmed as boolean || false
      const finalOpacity = (fromDimmed || toDimmed) ? opacity * 0.2 : opacity

      p.stroke(categoryColor.replace(/[\d.]+\)$/, `${finalOpacity})`))
      p.strokeWeight(1)

      // Draw dotted line effect
      const segments = 10
      for (let i = 0; i < segments; i += 2) {
        const t1 = i / segments
        const t2 = (i + 1) / segments

        const x1 = from.position.x + (to.position.x - from.position.x) * t1
        const y1 = from.position.y + (to.position.y - from.position.y) * t1
        const z1 = from.position.z + (to.position.z - from.position.z) * t1

        const x2 = from.position.x + (to.position.x - from.position.x) * t2
        const y2 = from.position.y + (to.position.y - from.position.y) * t2
        const z2 = from.position.z + (to.position.z - from.position.z) * t2

        p.line(
          x1 - p.width / 2, y1 - p.height / 2, z1,
          x2 - p.width / 2, y2 - p.height / 2, z2
        )
      }
    }

    // Draw orbital paths (faint circles)
    p.noFill()
    p.strokeWeight(0.5)

    // Inner orbit
    p.stroke(colors.connection.replace(/[\d.]+\)$/, '0.1)'))
    p.push()
    p.translate(sunX, sunY, sunZ)
    p.rotateX(p.PI / 2)
    p.ellipse(0, 0, 160, 160)
    p.pop()

    // Middle orbit
    p.push()
    p.translate(sunX, sunY, sunZ)
    p.rotateX(p.PI / 2)
    p.ellipse(0, 0, 280, 280)
    p.pop()

    // Outer orbit
    p.push()
    p.translate(sunX, sunY, sunZ)
    p.rotateX(p.PI / 2)
    p.ellipse(0, 0, 400, 400)
    p.pop()

    // Draw particles (tags)
    for (const particle of particles) {
      const x = particle.position.x - p.width / 2
      const y = particle.position.y - p.height / 2
      const z = particle.position.z

      const isDimmed = particle.data?.dimmed as boolean || false
      const isHighlighted = particle.data?.highlighted as boolean || false
      const opacity = isDimmed ? 0.3 : 1

      p.push()
      p.translate(x, y, z)

      // Glow for highlighted particles
      if (isHighlighted) {
        p.noStroke()
        p.fill(colors.highlight.replace(/[\d.]+\)$/, '0.4)'))
        p.sphere(particle.radius * 2.5)
      }

      // Outer glow
      p.noStroke()
      const glowColor = particle.color.replace(/[\d.]+\)$/, `${0.3 * opacity})`)
      p.fill(glowColor)
      p.sphere(particle.radius * 1.8)

      // Core sphere
      const coreColor = particle.color.replace(/[\d.]+\)$/, `${0.8 * opacity})`)
      p.fill(coreColor)
      p.sphere(particle.radius)

      p.pop()

      // Draw label (billboard text)
      // Note: p5 WEBGL text is limited, so we draw labels in overlay
    }

    // Draw title overlay
    if (dinnerTitle) {
      p.push()
      p.resetMatrix()
      p.fill(colors.particle)
      p.textSize(12)
      p.textAlign(p.LEFT, p.TOP)
      p.text(`${particles.length} Tags orbiting "${dinnerTitle}"`, 20, 20)
      p.pop()
    }
  }, [dinnerTitle])

  const handleMousePressed = useCallback((p: any, x: number, y: number) => {
    const system = orbitalSystemRef.current
    if (!system || !onTagClick) return

    const particles = system.getParticles()

    for (const particle of particles) {
      const screenX = particle.position.x
      const screenY = particle.position.y
      const dist = Math.sqrt((x - screenX) ** 2 + (y - screenY) ** 2)

      if (dist < particle.radius * 3) {
        // Highlight category
        system.highlightCategory(particle.category)
        onTagClick(particle.id)
        break
      }
    }
  }, [onTagClick])

  const handleMouseReleased = useCallback(() => {
    // Clear highlight when mouse released
    const system = orbitalSystemRef.current
    if (system) {
      system.highlightCategory(null)
    }
  }, [])

  if (tags.length === 0) return null

  return (
    <div className={`relative w-full h-full ${className}`}>
      <P5WebGLWrapper
        onSetup={handleSetup}
        onDraw={handleDraw}
        onMousePressed={handleMousePressed}
        onMouseReleased={handleMouseReleased}
        enableOrbitControls={true}
        enableGlow={true}
        targetFPS={60}
        is3D={true}
      />

      {/* Tag labels overlay */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1 max-w-xs">
        <div className="font-medium text-foreground-secondary mb-2">Tags</div>
        <div className="flex flex-wrap gap-1">
          {tags.map(tag => (
            <span
              key={tag.id}
              className="px-2 py-0.5 rounded-full text-foreground-muted"
              style={{
                backgroundColor: CATEGORY_LINE_COLORS[tag.category]?.replace('0.4', '0.2') || 'rgba(128,128,128,0.2)',
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
