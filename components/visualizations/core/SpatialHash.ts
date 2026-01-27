// Spatial Hash Grid for O(n) neighbor lookups instead of O(n²)
// Dramatically improves performance for connection calculations

import { Vector3D, Particle3D } from './types'

interface SpatialCell {
  particles: Particle3D[]
}

export class SpatialHash {
  private cellSize: number
  private grid: Map<string, SpatialCell>
  private particles: Particle3D[]

  constructor(cellSize: number = 150) {
    this.cellSize = cellSize
    this.grid = new Map()
    this.particles = []
  }

  // Generate hash key from 3D position
  private getKey(x: number, y: number, z: number): string {
    const cellX = Math.floor(x / this.cellSize)
    const cellY = Math.floor(y / this.cellSize)
    const cellZ = Math.floor(z / this.cellSize)
    return `${cellX},${cellY},${cellZ}`
  }

  // Get key from position vector
  private getKeyFromPosition(pos: Vector3D): string {
    return this.getKey(pos.x, pos.y, pos.z)
  }

  // Clear and rebuild the spatial hash
  rebuild(particles: Particle3D[]): void {
    this.grid.clear()
    this.particles = particles

    for (const particle of particles) {
      this.insert(particle)
    }
  }

  // Insert a particle into the grid
  private insert(particle: Particle3D): void {
    const key = this.getKeyFromPosition(particle.position)

    if (!this.grid.has(key)) {
      this.grid.set(key, { particles: [] })
    }

    this.grid.get(key)!.particles.push(particle)
  }

  // Get all particles in neighboring cells (3x3x3 cube for 3D)
  getNeighbors(particle: Particle3D): Particle3D[] {
    const neighbors: Particle3D[] = []
    const pos = particle.position

    const cellX = Math.floor(pos.x / this.cellSize)
    const cellY = Math.floor(pos.y / this.cellSize)
    const cellZ = Math.floor(pos.z / this.cellSize)

    // Check 3x3x3 neighboring cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${cellX + dx},${cellY + dy},${cellZ + dz}`
          const cell = this.grid.get(key)

          if (cell) {
            for (const other of cell.particles) {
              if (other.id !== particle.id) {
                neighbors.push(other)
              }
            }
          }
        }
      }
    }

    return neighbors
  }

  // Get neighbors within a specific distance (more precise filtering)
  getNeighborsWithinDistance(particle: Particle3D, maxDistance: number): Particle3D[] {
    const neighbors = this.getNeighbors(particle)
    const maxDistSq = maxDistance * maxDistance

    return neighbors.filter(other => {
      const dx = particle.position.x - other.position.x
      const dy = particle.position.y - other.position.y
      const dz = particle.position.z - other.position.z
      const distSq = dx * dx + dy * dy + dz * dz
      return distSq <= maxDistSq
    })
  }

  // Get all unique pairs of nearby particles (for connection drawing)
  // This is the key optimization - instead of O(n²) we get roughly O(n)
  getNearbyPairs(maxDistance: number): Array<[Particle3D, Particle3D, number]> {
    const pairs: Array<[Particle3D, Particle3D, number]> = []
    const visited = new Set<string>()
    const maxDistSq = maxDistance * maxDistance

    for (const particle of this.particles) {
      const neighbors = this.getNeighbors(particle)

      for (const other of neighbors) {
        // Create unique pair key (order-independent)
        const pairKey = particle.id < other.id
          ? `${particle.id}-${other.id}`
          : `${other.id}-${particle.id}`

        if (visited.has(pairKey)) continue
        visited.add(pairKey)

        // Calculate actual distance
        const dx = particle.position.x - other.position.x
        const dy = particle.position.y - other.position.y
        const dz = particle.position.z - other.position.z
        const distSq = dx * dx + dy * dy + dz * dz

        if (distSq <= maxDistSq) {
          pairs.push([particle, other, Math.sqrt(distSq)])
        }
      }
    }

    return pairs
  }

  // Update a single particle's position in the grid
  updateParticle(particle: Particle3D, oldPosition: Vector3D): void {
    const oldKey = this.getKeyFromPosition(oldPosition)
    const newKey = this.getKeyFromPosition(particle.position)

    if (oldKey !== newKey) {
      // Remove from old cell
      const oldCell = this.grid.get(oldKey)
      if (oldCell) {
        const index = oldCell.particles.findIndex(p => p.id === particle.id)
        if (index !== -1) {
          oldCell.particles.splice(index, 1)
        }
        if (oldCell.particles.length === 0) {
          this.grid.delete(oldKey)
        }
      }

      // Add to new cell
      if (!this.grid.has(newKey)) {
        this.grid.set(newKey, { particles: [] })
      }
      this.grid.get(newKey)!.particles.push(particle)
    }
  }

  // Get statistics for debugging
  getStats(): { cellCount: number; maxCellSize: number; avgCellSize: number } {
    let maxSize = 0
    let totalSize = 0

    for (const cell of this.grid.values()) {
      maxSize = Math.max(maxSize, cell.particles.length)
      totalSize += cell.particles.length
    }

    return {
      cellCount: this.grid.size,
      maxCellSize: maxSize,
      avgCellSize: this.grid.size > 0 ? totalSize / this.grid.size : 0,
    }
  }
}

// 2D version for simpler use cases
export class SpatialHash2D {
  private cellSize: number
  private grid: Map<string, Particle3D[]>

  constructor(cellSize: number = 150) {
    this.cellSize = cellSize
    this.grid = new Map()
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize)
    const cellY = Math.floor(y / this.cellSize)
    return `${cellX},${cellY}`
  }

  rebuild(particles: Particle3D[]): void {
    this.grid.clear()

    for (const particle of particles) {
      const key = this.getKey(particle.position.x, particle.position.y)
      if (!this.grid.has(key)) {
        this.grid.set(key, [])
      }
      this.grid.get(key)!.push(particle)
    }
  }

  getNeighbors(particle: Particle3D): Particle3D[] {
    const neighbors: Particle3D[] = []
    const cellX = Math.floor(particle.position.x / this.cellSize)
    const cellY = Math.floor(particle.position.y / this.cellSize)

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`
        const cell = this.grid.get(key)
        if (cell) {
          for (const other of cell) {
            if (other.id !== particle.id) {
              neighbors.push(other)
            }
          }
        }
      }
    }

    return neighbors
  }
}
