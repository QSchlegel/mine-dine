// Core types for 3D visualization system

export interface Vector3D {
  x: number
  y: number
  z: number
}

export interface Particle3D {
  id: string
  position: Vector3D
  velocity: Vector3D
  acceleration: Vector3D
  radius: number
  color: string
  mass: number
  history: Vector3D[]
  data?: Record<string, unknown>
}

export interface GraphNode extends Particle3D {
  label: string
  connections: string[]
  highlighted: boolean
  opacity: number
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
  pulsePhase: number
}

export interface OrbitalParticle extends Particle3D {
  orbitRadius: number
  orbitSpeed: number
  orbitTilt: number
  phase: number
  category: string
}

export interface CameraState {
  position: Vector3D
  rotation: Vector3D
  zoom: number
  targetPosition: Vector3D
  targetRotation: Vector3D
}

export interface VisualizationConfig {
  particleCount: number
  connectionDistance: number
  repulsionStrength: number
  attractionStrength: number
  damping: number
  maxSpeed: number
  glowIntensity: number
  trailLength: number
}

export interface ThemeColors {
  particle: string
  particleGlow: string
  connection: string
  connectionPulse: string
  highlight: string
  accent: string
  background: string
}

export const DEFAULT_CONFIG: VisualizationConfig = {
  particleCount: 100,
  connectionDistance: 150,
  repulsionStrength: 500,
  attractionStrength: 0.01,
  damping: 0.95,
  maxSpeed: 5,
  glowIntensity: 1.5,
  trailLength: 10,
}

export const DARK_THEME_COLORS: ThemeColors = {
  particle: 'rgba(236, 72, 153, 0.8)',
  particleGlow: 'rgba(236, 72, 153, 0.5)',
  connection: 'rgba(219, 39, 119, 0.3)',
  connectionPulse: 'rgba(236, 72, 153, 0.6)',
  highlight: 'rgba(6, 182, 212, 0.8)',
  accent: 'rgba(236, 72, 153, 0.8)',
  background: 'rgba(13, 13, 18, 0)',
}

export const LIGHT_THEME_COLORS: ThemeColors = {
  particle: 'rgba(236, 72, 153, 0.7)',
  particleGlow: 'rgba(236, 72, 153, 0.4)',
  connection: 'rgba(219, 39, 119, 0.25)',
  connectionPulse: 'rgba(236, 72, 153, 0.5)',
  highlight: 'rgba(6, 182, 212, 0.7)',
  accent: 'rgba(236, 72, 153, 0.7)',
  background: 'rgba(255, 255, 255, 0)',
}

// Cuisine-based color mapping for network graph nodes
export const CUISINE_COLORS: Record<string, string> = {
  ITALIAN: 'rgba(220, 38, 38, 0.8)',      // Warm red
  ASIAN: 'rgba(34, 197, 94, 0.8)',        // Jade green
  FRENCH: 'rgba(168, 85, 247, 0.8)',      // Purple
  MEXICAN: 'rgba(249, 115, 22, 0.8)',     // Orange
  INDIAN: 'rgba(234, 179, 8, 0.8)',       // Gold
  MEDITERRANEAN: 'rgba(59, 130, 246, 0.8)', // Blue
  AMERICAN: 'rgba(239, 68, 68, 0.8)',     // Red
  JAPANESE: 'rgba(236, 72, 153, 0.8)',    // Pink
  DEFAULT: 'rgba(251, 191, 36, 0.8)',     // Amber
}
