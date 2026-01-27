'use client'

import { useCallback, useRef, useEffect } from 'react'
import P5WebGLWrapper from '../P5WebGLWrapper'
import { ForceGraph3D } from '../core/ForceGraph3D'
import { ThemeColors, CUISINE_COLORS, GraphNode, GraphEdge } from '../core/types'

export interface HostData {
  id: string
  name: string
  profileImageUrl?: string | null
  tags: Array<{ id: string; name: string; category: string }>
  rating?: number
  matchScore?: number
}

interface DiscoveryVisualizationProps {
  hosts: HostData[]
  currentHostId?: string | null
  onNodeClick?: (hostId: string) => void
  className?: string
}

export default function DiscoveryVisualization({
  hosts,
  currentHostId,
  onNodeClick,
  className = '',
}: DiscoveryVisualizationProps) {
  const graphRef = useRef<ForceGraph3D | null>(null)
  const hostsRef = useRef<HostData[]>([])
  const isInitializedRef = useRef(false)

  // Update hosts ref when hosts change
  useEffect(() => {
    hostsRef.current = hosts
  }, [hosts])

  // Highlight current host when it changes
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.highlightNode(currentHostId || null)
      if (currentHostId) {
        graphRef.current.reheat(0.2)
      }
    }
  }, [currentHostId])

  const handleSetup = useCallback((p: any, colors: ThemeColors) => {
    // Initialize force graph
    const graph = new ForceGraph3D({
      repulsionStrength: 800,
      attractionStrength: 0.015,
      connectionDistance: 200,
      damping: 0.92,
      centeringStrength: 0.03,
      zSpread: 400,
    })

    graphRef.current = graph

    // Add nodes from hosts
    const hostData = hostsRef.current
    for (const host of hostData) {
      // Determine color based on primary cuisine tag
      const cuisineTag = host.tags.find(t => t.category === 'CUISINE')
      const cuisineName = cuisineTag?.name.toUpperCase() || 'DEFAULT'
      const color = CUISINE_COLORS[cuisineName] || CUISINE_COLORS.DEFAULT

      // Size based on rating (1-5 → 10-25)
      const radius = 10 + (host.rating || 3) * 3

      graph.addNode({
        id: host.id,
        label: host.name || 'Host',
        position: { x: 0, y: 0, z: 0 },
        radius,
        color,
        mass: 1 + (host.matchScore || 0),
        connections: [],
        data: {
          name: host.name,
          tags: host.tags,
          rating: host.rating,
          matchScore: host.matchScore,
          profileImageUrl: host.profileImageUrl,
        },
      })
    }

    // Create edges based on shared tags
    for (let i = 0; i < hostData.length; i++) {
      for (let j = i + 1; j < hostData.length; j++) {
        const host1 = hostData[i]
        const host2 = hostData[j]

        // Find shared tags
        const tags1 = new Set(host1.tags.map(t => t.id))
        const sharedTags = host2.tags.filter(t => tags1.has(t.id))

        if (sharedTags.length > 0) {
          // Weight based on number of shared tags
          const weight = 0.5 + sharedTags.length * 0.25
          graph.addEdge(host1.id, host2.id, Math.min(weight, 2))
        }
      }
    }

    // Initialize positions
    graph.initializePositions(p.width, p.height)

    isInitializedRef.current = true
  }, [])

  const handleDraw = useCallback((
    p: any,
    colors: ThemeColors,
    _camera: any,
    deltaTime: number
  ) => {
    const graph = graphRef.current
    if (!graph || !isInitializedRef.current) return

    // Update simulation
    graph.tick(deltaTime * 60) // Normalize to ~60fps

    const nodes = graph.getNodes()
    const edges = graph.getEdges()

    // Draw connections first (behind nodes)
    p.strokeWeight(1)
    for (const edge of edges) {
      const source = graph.getNode(edge.source)
      const target = graph.getNode(edge.target)
      if (!source || !target) continue

      // Calculate opacity based on nodes' opacity and pulse
      const baseOpacity = Math.min(source.opacity, target.opacity) * 0.5
      const pulseOpacity = (Math.sin(edge.pulsePhase) + 1) / 2 * 0.3
      const opacity = baseOpacity + pulseOpacity

      // Connection color
      const strokeColor = colors.connection.replace(/[\d.]+\)$/, `${opacity})`)
      p.stroke(strokeColor)

      p.line(
        source.position.x - p.width / 2,
        source.position.y - p.height / 2,
        source.position.z,
        target.position.x - p.width / 2,
        target.position.y - p.height / 2,
        target.position.z
      )

      // Draw pulse point traveling along edge
      if (opacity > 0.3) {
        const t = (Math.sin(edge.pulsePhase * 0.5) + 1) / 2
        const px = source.position.x + (target.position.x - source.position.x) * t
        const py = source.position.y + (target.position.y - source.position.y) * t
        const pz = source.position.z + (target.position.z - source.position.z) * t

        p.push()
        p.noStroke()
        const pulseColor = colors.connectionPulse.replace(/[\d.]+\)$/, `${opacity * 1.5})`)
        p.fill(pulseColor)
        p.translate(px - p.width / 2, py - p.height / 2, pz)
        p.sphere(2)
        p.pop()
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const x = node.position.x - p.width / 2
      const y = node.position.y - p.height / 2
      const z = node.position.z

      p.push()
      p.translate(x, y, z)

      // Outer glow (larger, transparent)
      if (node.highlighted || node.opacity > 0.7) {
        p.noStroke()
        const glowOpacity = node.highlighted ? 0.4 : 0.2 * node.opacity
        const glowColor = node.highlighted
          ? colors.highlight.replace(/[\d.]+\)$/, `${glowOpacity})`)
          : node.color.replace(/[\d.]+\)$/, `${glowOpacity})`)
        p.fill(glowColor)
        p.sphere(node.radius * 2)
      }

      // Core sphere
      const coreOpacity = node.opacity * 0.9
      const coreColor = node.highlighted
        ? colors.highlight.replace(/[\d.]+\)$/, `${coreOpacity})`)
        : node.color.replace(/[\d.]+\)$/, `${coreOpacity})`)
      p.noStroke()
      p.fill(coreColor)
      p.sphere(node.radius)

      // Highlight ring for current node
      if (node.highlighted) {
        p.noFill()
        p.stroke(colors.highlight)
        p.strokeWeight(2)
        // Draw ring using rotated ellipse
        for (let i = 0; i < 3; i++) {
          p.push()
          p.rotateY(p.frameCount * 0.02 + i * p.PI / 3)
          p.ellipse(0, 0, node.radius * 3, node.radius * 3)
          p.pop()
        }
      }

      p.pop()

      // Draw label (always facing camera - simplified billboard)
      if (node.opacity > 0.5) {
        const labelOpacity = node.opacity * 0.8
        p.push()
        p.translate(x, y - node.radius * 1.8, z)
        // In WEBGL mode, we need to handle text differently
        // For now, skip text rendering as p5 WEBGL text has limitations
        p.pop()
      }
    }

    // Draw title overlay (not in 3D space)
    p.push()
    p.resetMatrix()
    p.fill(colors.particle)
    p.textSize(14)
    p.textAlign(p.LEFT, p.TOP)
    p.text(`${nodes.length} Hosts • Drag to rotate`, 20, 20)
    p.pop()
  }, [])

  const handleMousePressed = useCallback((p: any, x: number, y: number) => {
    // Check if click is on a node (simplified hit detection)
    const graph = graphRef.current
    if (!graph || !onNodeClick) return

    const nodes = graph.getNodes()
    const centerX = p.width / 2
    const centerY = p.height / 2

    for (const node of nodes) {
      const screenX = node.position.x
      const screenY = node.position.y
      const dist = Math.sqrt((x - screenX) ** 2 + (y - screenY) ** 2)

      if (dist < node.radius * 2) {
        onNodeClick(node.id)
        break
      }
    }
  }, [onNodeClick])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <P5WebGLWrapper
        onSetup={handleSetup}
        onDraw={handleDraw}
        onMousePressed={handleMousePressed}
        enableOrbitControls={true}
        enableGlow={true}
        targetFPS={60}
        is3D={true}
      />

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1">
        <div className="font-medium text-foreground-secondary mb-2">Cuisine Colors</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CUISINE_COLORS).slice(0, 6).map(([cuisine, color]) => (
            <div key={cuisine} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-foreground-muted capitalize">
                {cuisine.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
