// Force-Directed 3D Graph Layout
// Uses Coulomb's law for repulsion and Hooke's law for attraction

import { Vector3D, GraphNode, GraphEdge, VisualizationConfig, DEFAULT_CONFIG } from './types'
import { SpatialHash } from './SpatialHash'

export interface ForceGraphConfig extends Partial<VisualizationConfig> {
  centeringStrength?: number
  zSpread?: number
  velocityDecay?: number
  alphaDecay?: number
  alphaMin?: number
}

export class ForceGraph3D {
  private nodes: Map<string, GraphNode>
  private edges: GraphEdge[]
  private spatialHash: SpatialHash
  private config: Required<ForceGraphConfig>
  private alpha: number // Simulation "temperature" - decreases over time

  constructor(config: ForceGraphConfig = {}) {
    this.nodes = new Map()
    this.edges = []
    this.spatialHash = new SpatialHash(config.connectionDistance || DEFAULT_CONFIG.connectionDistance)
    this.alpha = 1

    this.config = {
      ...DEFAULT_CONFIG,
      centeringStrength: 0.05,
      zSpread: 300,
      velocityDecay: 0.4,
      alphaDecay: 0.0005,
      alphaMin: 0.001,
      ...config,
    }
  }

  // Add a node to the graph
  addNode(node: Omit<GraphNode, 'velocity' | 'acceleration' | 'history' | 'highlighted' | 'opacity'>): void {
    const fullNode: GraphNode = {
      ...node,
      velocity: { x: 0, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      history: [],
      highlighted: false,
      opacity: 1,
    }
    this.nodes.set(node.id, fullNode)
  }

  // Add an edge between two nodes
  addEdge(sourceId: string, targetId: string, weight: number = 1): void {
    if (this.nodes.has(sourceId) && this.nodes.has(targetId)) {
      this.edges.push({
        source: sourceId,
        target: targetId,
        weight,
        pulsePhase: Math.random() * Math.PI * 2, // Random starting phase for pulse animation
      })

      // Update node connections
      const sourceNode = this.nodes.get(sourceId)!
      const targetNode = this.nodes.get(targetId)!

      if (!sourceNode.connections.includes(targetId)) {
        sourceNode.connections.push(targetId)
      }
      if (!targetNode.connections.includes(sourceId)) {
        targetNode.connections.push(sourceId)
      }
    }
  }

  // Initialize nodes with random positions in 3D space
  initializePositions(width: number, height: number): void {
    const centerX = width / 2
    const centerY = height / 2
    const spread = Math.min(width, height) * 0.3

    for (const node of this.nodes.values()) {
      if (node.position.x === 0 && node.position.y === 0 && node.position.z === 0) {
        node.position = {
          x: centerX + (Math.random() - 0.5) * spread * 2,
          y: centerY + (Math.random() - 0.5) * spread * 2,
          z: (Math.random() - 0.5) * this.config.zSpread,
        }
      }
    }
  }

  // Calculate distance between two vectors
  private distance(a: Vector3D, b: Vector3D): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = a.z - b.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  // Apply all forces and update positions
  tick(deltaTime: number = 1): void {
    if (this.alpha < this.config.alphaMin) return

    const nodeArray = Array.from(this.nodes.values())
    this.spatialHash.rebuild(nodeArray)

    // Reset accelerations
    for (const node of nodeArray) {
      node.acceleration = { x: 0, y: 0, z: 0 }
    }

    // Apply forces
    this.applyRepulsionForce(nodeArray)
    this.applyAttractionForce()
    this.applyCenteringForce(nodeArray)

    // Update velocities and positions
    for (const node of nodeArray) {
      // Apply acceleration to velocity
      node.velocity.x += node.acceleration.x * this.alpha * deltaTime
      node.velocity.y += node.acceleration.y * this.alpha * deltaTime
      node.velocity.z += node.acceleration.z * this.alpha * deltaTime

      // Apply velocity decay (friction)
      node.velocity.x *= this.config.velocityDecay
      node.velocity.y *= this.config.velocityDecay
      node.velocity.z *= this.config.velocityDecay

      // Clamp velocity
      const speed = Math.sqrt(
        node.velocity.x ** 2 +
        node.velocity.y ** 2 +
        node.velocity.z ** 2
      )
      if (speed > this.config.maxSpeed) {
        const scale = this.config.maxSpeed / speed
        node.velocity.x *= scale
        node.velocity.y *= scale
        node.velocity.z *= scale
      }

      // Update position
      node.position.x += node.velocity.x * deltaTime
      node.position.y += node.velocity.y * deltaTime
      node.position.z += node.velocity.z * deltaTime

      // Store history for trails
      node.history.unshift({ ...node.position })
      if (node.history.length > this.config.trailLength) {
        node.history.pop()
      }
    }

    // Update edge pulse phases
    for (const edge of this.edges) {
      edge.pulsePhase += 0.05
    }

    // Cool down simulation
    this.alpha = Math.max(this.config.alphaMin, this.alpha - this.config.alphaDecay)
  }

  // Coulomb's law: particles repel each other
  private applyRepulsionForce(nodes: GraphNode[]): void {
    for (const node of nodes) {
      const neighbors = this.spatialHash.getNeighbors(node)

      for (const other of neighbors) {
        const dx = node.position.x - other.position.x
        const dy = node.position.y - other.position.y
        const dz = node.position.z - other.position.z
        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        // Prevent division by zero
        if (dist < 1) dist = 1

        // Coulomb's law: F = k * q1 * q2 / r²
        const force = (this.config.repulsionStrength * node.mass * (other as GraphNode).mass) / (dist * dist)

        // Normalize and apply
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        const fz = (dz / dist) * force

        node.acceleration.x += fx / node.mass
        node.acceleration.y += fy / node.mass
        node.acceleration.z += fz / node.mass
      }
    }
  }

  // Hooke's law: connected nodes attract
  private applyAttractionForce(): void {
    for (const edge of this.edges) {
      const source = this.nodes.get(edge.source)
      const target = this.nodes.get(edge.target)

      if (!source || !target) continue

      const dx = target.position.x - source.position.x
      const dy = target.position.y - source.position.y
      const dz = target.position.z - source.position.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < 1) continue

      // Hooke's law: F = -k * x
      const force = this.config.attractionStrength * dist * edge.weight

      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      const fz = (dz / dist) * force

      source.acceleration.x += fx
      source.acceleration.y += fy
      source.acceleration.z += fz

      target.acceleration.x -= fx
      target.acceleration.y -= fy
      target.acceleration.z -= fz
    }
  }

  // Gentle centering force to keep graph in view
  private applyCenteringForce(nodes: GraphNode[]): void {
    // Calculate center of mass
    let cx = 0, cy = 0, cz = 0
    for (const node of nodes) {
      cx += node.position.x
      cy += node.position.y
      cz += node.position.z
    }
    cx /= nodes.length
    cy /= nodes.length
    cz /= nodes.length

    // Apply gentle force toward origin
    for (const node of nodes) {
      node.acceleration.x -= (node.position.x - cx) * this.config.centeringStrength
      node.acceleration.y -= (node.position.y - cy) * this.config.centeringStrength
      node.acceleration.z -= node.position.z * this.config.centeringStrength * 0.5 // Weaker Z centering
    }
  }

  // Highlight a node and its connections
  highlightNode(nodeId: string | null): void {
    for (const node of this.nodes.values()) {
      if (nodeId === null) {
        node.highlighted = false
        node.opacity = 1
      } else if (node.id === nodeId) {
        node.highlighted = true
        node.opacity = 1
      } else if (node.connections.includes(nodeId)) {
        node.highlighted = false
        node.opacity = 0.8
      } else {
        node.highlighted = false
        node.opacity = 0.3
      }
    }
  }

  // Apply impulse to a node (for swipe animations)
  applyImpulse(nodeId: string, direction: Vector3D, strength: number): void {
    const node = this.nodes.get(nodeId)
    if (node) {
      node.velocity.x += direction.x * strength
      node.velocity.y += direction.y * strength
      node.velocity.z += direction.z * strength
    }
  }

  // Reheat simulation (useful after user interaction)
  reheat(alpha: number = 0.3): void {
    this.alpha = Math.min(1, this.alpha + alpha)
  }

  // Get all nodes
  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values())
  }

  // Get all edges
  getEdges(): GraphEdge[] {
    return this.edges
  }

  // Get a specific node
  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id)
  }

  // Get connected edges for a node
  getNodeEdges(nodeId: string): GraphEdge[] {
    return this.edges.filter(e => e.source === nodeId || e.target === nodeId)
  }

  // Remove a node and its edges
  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId)
    this.edges = this.edges.filter(e => e.source !== nodeId && e.target !== nodeId)

    // Remove from other nodes' connections
    for (const node of this.nodes.values()) {
      const index = node.connections.indexOf(nodeId)
      if (index !== -1) {
        node.connections.splice(index, 1)
      }
    }
  }

  // Get current simulation alpha (temperature)
  getAlpha(): number {
    return this.alpha
  }

  // Check if simulation has stabilized
  isStabilized(): boolean {
    return this.alpha <= this.config.alphaMin
  }
}
