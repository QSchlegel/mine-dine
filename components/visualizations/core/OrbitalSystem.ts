// Orbital System for Dinner Constellation Visualization
// Tags orbit around a central "sun" (the dinner) like planets

import { Vector3D, OrbitalParticle, ThemeColors } from './types'

export interface OrbitalConfig {
  innerOrbitRadius: number
  middleOrbitRadius: number
  outerOrbitRadius: number
  baseSpeed: number
  speedVariation: number
  tiltVariation: number
}

const DEFAULT_ORBITAL_CONFIG: OrbitalConfig = {
  innerOrbitRadius: 80,
  middleOrbitRadius: 140,
  outerOrbitRadius: 200,
  baseSpeed: 0.005,
  speedVariation: 0.003,
  tiltVariation: Math.PI / 6,
}

// Mapping of tag categories to orbit levels
export const CATEGORY_ORBITS: Record<string, 'inner' | 'middle' | 'outer'> = {
  CUISINE: 'inner',
  DIETARY: 'middle',
  INTEREST: 'outer',
  LIFESTYLE: 'outer',
  SKILL: 'middle',
}

export class OrbitalSystem {
  private particles: OrbitalParticle[]
  private config: OrbitalConfig
  private centerPosition: Vector3D
  private scatterForce: number
  private isScattered: boolean

  constructor(config: Partial<OrbitalConfig> = {}) {
    this.particles = []
    this.config = { ...DEFAULT_ORBITAL_CONFIG, ...config }
    this.centerPosition = { x: 0, y: 0, z: 0 }
    this.scatterForce = 0
    this.isScattered = false
  }

  // Set the center position (dinner location)
  setCenter(x: number, y: number, z: number = 0): void {
    this.centerPosition = { x, y, z }
  }

  // Add a tag as an orbiting particle
  addTag(
    id: string,
    label: string,
    category: string,
    color: string
  ): void {
    const orbitLevel = CATEGORY_ORBITS[category] || 'outer'
    let orbitRadius: number

    switch (orbitLevel) {
      case 'inner':
        orbitRadius = this.config.innerOrbitRadius + (Math.random() - 0.5) * 20
        break
      case 'middle':
        orbitRadius = this.config.middleOrbitRadius + (Math.random() - 0.5) * 30
        break
      case 'outer':
      default:
        orbitRadius = this.config.outerOrbitRadius + (Math.random() - 0.5) * 40
    }

    // Speed inversely proportional to orbit radius (Kepler-like)
    const speedMultiplier = this.config.innerOrbitRadius / orbitRadius
    const speed = (this.config.baseSpeed + (Math.random() - 0.5) * this.config.speedVariation) * speedMultiplier

    // Random orbital plane tilt
    const tilt = (Math.random() - 0.5) * this.config.tiltVariation * 2

    const particle: OrbitalParticle = {
      id,
      category,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      radius: 6 + Math.random() * 4,
      color,
      mass: 1,
      history: [],
      orbitRadius,
      orbitSpeed: speed,
      orbitTilt: tilt,
      phase: Math.random() * Math.PI * 2, // Random starting position
      data: { label, category },
    }

    // Calculate initial position
    this.updateParticlePosition(particle)
    this.particles.push(particle)
  }

  // Update a particle's position based on orbital mechanics
  private updateParticlePosition(particle: OrbitalParticle): void {
    const effectiveRadius = this.isScattered
      ? particle.orbitRadius * (1 + this.scatterForce)
      : particle.orbitRadius

    // 3D orbital position
    particle.position.x = this.centerPosition.x +
      Math.cos(particle.phase) * effectiveRadius

    particle.position.y = this.centerPosition.y +
      Math.sin(particle.phase) * Math.cos(particle.orbitTilt) * effectiveRadius

    particle.position.z = this.centerPosition.z +
      Math.sin(particle.phase) * Math.sin(particle.orbitTilt) * effectiveRadius
  }

  // Update all particles
  tick(deltaTime: number = 1): void {
    for (const particle of this.particles) {
      // Update orbital phase
      particle.phase += particle.orbitSpeed * deltaTime

      // Normalize phase to [0, 2π]
      if (particle.phase > Math.PI * 2) {
        particle.phase -= Math.PI * 2
      }

      // Store history for trail effect
      particle.history.unshift({ ...particle.position })
      if (particle.history.length > 10) {
        particle.history.pop()
      }

      // Update position
      this.updateParticlePosition(particle)
    }

    // Gradually reduce scatter force
    if (this.scatterForce > 0) {
      this.scatterForce *= 0.95
      if (this.scatterForce < 0.01) {
        this.scatterForce = 0
        this.isScattered = false
      }
    }
  }

  // Scatter particles outward (hover effect)
  scatter(force: number = 0.5): void {
    this.scatterForce = force
    this.isScattered = true
  }

  // Get all particles
  getParticles(): OrbitalParticle[] {
    return this.particles
  }

  // Get particles by category
  getParticlesByCategory(category: string): OrbitalParticle[] {
    return this.particles.filter(p => p.category === category)
  }

  // Highlight particles in the same category
  highlightCategory(category: string | null): void {
    for (const particle of this.particles) {
      if (category === null) {
        particle.data = { ...particle.data, highlighted: false, dimmed: false }
      } else if (particle.category === category) {
        particle.data = { ...particle.data, highlighted: true, dimmed: false }
      } else {
        particle.data = { ...particle.data, highlighted: false, dimmed: true }
      }
    }
  }

  // Get constellation lines (connections between same-category particles)
  getConstellationLines(): Array<{
    from: OrbitalParticle
    to: OrbitalParticle
    opacity: number
  }> {
    const lines: Array<{ from: OrbitalParticle; to: OrbitalParticle; opacity: number }> = []
    const byCategory: Record<string, OrbitalParticle[]> = {}

    // Group by category
    for (const particle of this.particles) {
      if (!byCategory[particle.category]) {
        byCategory[particle.category] = []
      }
      byCategory[particle.category].push(particle)
    }

    // Create constellation lines within each category
    for (const category of Object.keys(byCategory)) {
      const categoryParticles = byCategory[category]

      if (categoryParticles.length < 2) continue

      // Connect particles in a chain (sorted by phase for consistent pattern)
      const sorted = [...categoryParticles].sort((a, b) => a.phase - b.phase)

      for (let i = 0; i < sorted.length; i++) {
        const next = (i + 1) % sorted.length
        const from = sorted[i]
        const to = sorted[next]

        // Opacity based on z-position (depth fading)
        const avgZ = (from.position.z + to.position.z) / 2
        const zNormalized = (avgZ + 200) / 400 // Assuming z range of -200 to 200
        const opacity = 0.1 + zNormalized * 0.3

        lines.push({ from, to, opacity })
      }
    }

    return lines
  }

  // Clear all particles
  clear(): void {
    this.particles = []
  }

  // Remove a specific particle
  removeParticle(id: string): void {
    const index = this.particles.findIndex(p => p.id === id)
    if (index !== -1) {
      this.particles.splice(index, 1)
    }
  }

  // Get center position
  getCenter(): Vector3D {
    return { ...this.centerPosition }
  }
}

// Helper function to create an orbital system from dinner tags
export function createOrbitalSystemFromTags(
  tags: Array<{ id: string; name: string; category: string }>,
  colors: ThemeColors
): OrbitalSystem {
  const system = new OrbitalSystem()

  // Color mapping by category
  const categoryColors: Record<string, string> = {
    CUISINE: colors.accent,
    DIETARY: colors.highlight,
    INTEREST: colors.particle,
    LIFESTYLE: colors.connectionPulse,
    SKILL: colors.particleGlow,
  }

  for (const tag of tags) {
    const color = categoryColors[tag.category] || colors.particle
    system.addTag(tag.id, tag.name, tag.category, color)
  }

  return system
}
