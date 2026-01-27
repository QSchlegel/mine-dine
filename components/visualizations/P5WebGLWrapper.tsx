'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTheme } from '../ThemeProvider'
import { CameraState, ThemeColors, DARK_THEME_COLORS, LIGHT_THEME_COLORS } from './core/types'

export interface P5WebGLWrapperProps {
  className?: string
  onSetup?: (p: any, colors: ThemeColors, camera: CameraState) => void
  onDraw?: (p: any, colors: ThemeColors, camera: CameraState, deltaTime: number) => void
  onMouseMoved?: (p: any, x: number, y: number) => void
  onMouseDragged?: (p: any, dx: number, dy: number) => void
  onMouseWheel?: (p: any, delta: number) => void
  onMousePressed?: (p: any, x: number, y: number) => void
  onMouseReleased?: (p: any) => void
  enableOrbitControls?: boolean
  enableGlow?: boolean
  targetFPS?: number
  is3D?: boolean
}

export default function P5WebGLWrapper({
  className = '',
  onSetup,
  onDraw,
  onMouseMoved,
  onMouseDragged,
  onMouseWheel,
  onMousePressed,
  onMouseReleased,
  enableOrbitControls = true,
  enableGlow = true,
  targetFPS = 60,
  is3D = true,
}: P5WebGLWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<any>(null)
  const [shouldRender, setShouldRender] = useState(false)
  const { resolvedTheme } = useTheme()

  // Store callbacks in refs to avoid recreating sketch
  const callbacksRef = useRef({
    onSetup,
    onDraw,
    onMouseMoved,
    onMouseDragged,
    onMouseWheel,
    onMousePressed,
    onMouseReleased,
  })

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onSetup,
      onDraw,
      onMouseMoved,
      onMouseDragged,
      onMouseWheel,
      onMousePressed,
      onMouseReleased,
    }
  }, [onSetup, onDraw, onMouseMoved, onMouseDragged, onMouseWheel, onMousePressed, onMouseReleased])

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Check device capabilities
    const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4

    // Check WebGL support
    const canvas = document.createElement('canvas')
    const webglSupport = !!(
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    )

    if (prefersReducedMotion || isLowEndDevice || (is3D && !webglSupport)) {
      return
    }

    if (typeof window === 'undefined') return

    let mounted = true
    let isPaused = false
    let lastFrameTime = performance.now()

    const initP5 = async () => {
      try {
        const p5Module = await import('p5')
        const p5Constructor = p5Module.default || p5Module

        if (!p5Constructor || !mounted || !containerRef.current) return

        const container = containerRef.current

        // Camera state for orbit controls
        const camera: CameraState = {
          position: { x: 0, y: 0, z: 500 },
          rotation: { x: 0, y: 0, z: 0 },
          zoom: 1,
          targetPosition: { x: 0, y: 0, z: 500 },
          targetRotation: { x: 0, y: 0, z: 0 },
        }

        // Mouse state for dragging
        let isDragging = false
        let lastMouseX = 0
        let lastMouseY = 0

        const getColors = (): ThemeColors => {
          return resolvedTheme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS
        }

        const sketch = (p: any) => {
          let colors = getColors()

          p.setup = () => {
            const width = container.offsetWidth || window.innerWidth
            const height = container.offsetHeight || window.innerHeight

            // Create WebGL or 2D canvas based on prop
            const canvas = is3D
              ? p.createCanvas(width, height, p.WEBGL)
              : p.createCanvas(width, height)

            canvas.parent(container)
            canvas.elt.style.pointerEvents = 'auto'

            // Performance settings
            if (window.innerWidth < 1024) {
              p.pixelDensity(1)
              p.frameRate(Math.min(30, targetFPS))
            } else {
              p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2))
              p.frameRate(targetFPS)
            }

            if (is3D) {
              // Set up perspective
              p.perspective(p.PI / 3, width / height, 0.1, 5000)
            }

            // Call user setup
            if (callbacksRef.current.onSetup) {
              callbacksRef.current.onSetup(p, colors, camera)
            }
          }

          p.draw = () => {
            if (isPaused) return

            // Calculate delta time
            const now = performance.now()
            const deltaTime = (now - lastFrameTime) / 1000
            lastFrameTime = now

            // Update colors on theme change
            colors = getColors()

            // Clear with transparent background
            p.clear()

            if (is3D) {
              // Smooth camera interpolation
              camera.position.x += (camera.targetPosition.x - camera.position.x) * 0.1
              camera.position.y += (camera.targetPosition.y - camera.position.y) * 0.1
              camera.position.z += (camera.targetPosition.z - camera.position.z) * 0.1

              camera.rotation.x += (camera.targetRotation.x - camera.rotation.x) * 0.1
              camera.rotation.y += (camera.targetRotation.y - camera.rotation.y) * 0.1

              // Apply camera transforms
              p.translate(0, 0, -camera.position.z * camera.zoom)
              p.rotateX(camera.rotation.x)
              p.rotateY(camera.rotation.y)

              // Set up lighting for glow effect
              if (enableGlow) {
                p.ambientLight(60)
                p.pointLight(255, 200, 150, 0, 0, 500)
              }
            }

            // Call user draw
            if (callbacksRef.current.onDraw) {
              callbacksRef.current.onDraw(p, colors, camera, deltaTime)
            }
          }

          p.windowResized = () => {
            const width = container.offsetWidth || window.innerWidth
            const height = container.offsetHeight || window.innerHeight
            p.resizeCanvas(width, height)

            if (is3D) {
              p.perspective(p.PI / 3, width / height, 0.1, 5000)
            }

            // Update performance settings
            if (window.innerWidth < 1024) {
              p.pixelDensity(1)
              p.frameRate(Math.min(30, targetFPS))
            } else {
              p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2))
              p.frameRate(targetFPS)
            }
          }

          p.mouseMoved = () => {
            if (callbacksRef.current.onMouseMoved) {
              callbacksRef.current.onMouseMoved(p, p.mouseX, p.mouseY)
            }
          }

          p.mousePressed = () => {
            isDragging = true
            lastMouseX = p.mouseX
            lastMouseY = p.mouseY

            if (callbacksRef.current.onMousePressed) {
              callbacksRef.current.onMousePressed(p, p.mouseX, p.mouseY)
            }
          }

          p.mouseReleased = () => {
            isDragging = false

            if (callbacksRef.current.onMouseReleased) {
              callbacksRef.current.onMouseReleased(p)
            }
          }

          p.mouseDragged = () => {
            const dx = p.mouseX - lastMouseX
            const dy = p.mouseY - lastMouseY
            lastMouseX = p.mouseX
            lastMouseY = p.mouseY

            if (enableOrbitControls && isDragging && is3D) {
              // Orbit camera around scene
              camera.targetRotation.y += dx * 0.01
              camera.targetRotation.x += dy * 0.01

              // Clamp vertical rotation
              camera.targetRotation.x = p.constrain(
                camera.targetRotation.x,
                -p.PI / 2,
                p.PI / 2
              )
            }

            if (callbacksRef.current.onMouseDragged) {
              callbacksRef.current.onMouseDragged(p, dx, dy)
            }
          }

          p.mouseWheel = (event: { delta: number }) => {
            if (enableOrbitControls && is3D) {
              // Zoom in/out
              camera.zoom *= 1 + event.delta * 0.001
              camera.zoom = p.constrain(camera.zoom, 0.2, 3)
            }

            if (callbacksRef.current.onMouseWheel) {
              callbacksRef.current.onMouseWheel(p, event.delta)
            }

            return false // Prevent default scroll
          }

          // Touch support
          p.touchStarted = (e: TouchEvent) => {
            if (e.touches && e.touches.length > 0) {
              isDragging = true
              lastMouseX = e.touches[0].clientX
              lastMouseY = e.touches[0].clientY

              if (callbacksRef.current.onMousePressed) {
                callbacksRef.current.onMousePressed(p, lastMouseX, lastMouseY)
              }
            }
            return false
          }

          p.touchMoved = (e: TouchEvent) => {
            if (e.touches && e.touches.length > 0) {
              const touchX = e.touches[0].clientX
              const touchY = e.touches[0].clientY
              const dx = touchX - lastMouseX
              const dy = touchY - lastMouseY
              lastMouseX = touchX
              lastMouseY = touchY

              if (enableOrbitControls && isDragging && is3D) {
                camera.targetRotation.y += dx * 0.01
                camera.targetRotation.x += dy * 0.01
                camera.targetRotation.x = p.constrain(
                  camera.targetRotation.x,
                  -p.PI / 2,
                  p.PI / 2
                )
              }

              if (callbacksRef.current.onMouseDragged) {
                callbacksRef.current.onMouseDragged(p, dx, dy)
              }
            }
            return false
          }

          p.touchEnded = () => {
            isDragging = false
            if (callbacksRef.current.onMouseReleased) {
              callbacksRef.current.onMouseReleased(p)
            }
            return false
          }
        }

        // Initialize p5
        if (!mounted || !containerRef.current) return

        try {
          setShouldRender(true)
          p5InstanceRef.current = new p5Constructor(sketch, containerRef.current)
        } catch (error) {
          console.error('Failed to initialize p5 WebGL:', error)
          setShouldRender(false)
        }
      } catch (error) {
        console.error('Failed to load p5.js:', error)
      }
    }

    initP5()

    // Visibility handling
    const handleVisibilityChange = () => {
      isPaused = document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Orientation change
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
          // Ignore cleanup errors
        }
        p5InstanceRef.current = null
      }
    }
  }, [resolvedTheme, enableOrbitControls, enableGlow, targetFPS, is3D])

  if (!shouldRender) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full ${className}`}
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

// Helper functions for common 3D operations
export const helpers = {
  // Draw a glowing sphere
  drawGlowingSphere: (
    p: any,
    x: number,
    y: number,
    z: number,
    radius: number,
    color: string,
    glowRadius: number = 1.5
  ) => {
    p.push()
    p.translate(x, y, z)

    // Inner glow (larger, more transparent)
    p.noStroke()
    const glowColor = color.replace(/[\d.]+\)$/, '0.2)')
    p.fill(glowColor)
    p.sphere(radius * glowRadius)

    // Core sphere
    p.fill(color)
    p.sphere(radius)

    p.pop()
  },

  // Draw a line with thickness in WebGL
  drawThickLine: (
    p: any,
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    thickness: number,
    color: string
  ) => {
    p.push()
    p.stroke(color)
    p.strokeWeight(thickness)
    p.line(x1, y1, z1, x2, y2, z2)
    p.pop()
  },

  // Draw pulsing connection line
  drawPulsingLine: (
    p: any,
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    phase: number,
    baseColor: string,
    pulseColor: string
  ) => {
    const pulseOpacity = (Math.sin(phase) + 1) / 2 * 0.5 + 0.2

    // Base line
    p.stroke(baseColor)
    p.strokeWeight(1)
    p.line(x1, y1, z1, x2, y2, z2)

    // Pulse effect - a moving dot along the line
    const t = (Math.sin(phase * 0.5) + 1) / 2
    const px = x1 + (x2 - x1) * t
    const py = y1 + (y2 - y1) * t
    const pz = z1 + (z2 - z1) * t

    p.push()
    p.noStroke()
    p.fill(pulseColor.replace(/[\d.]+\)$/, `${pulseOpacity})`))
    p.translate(px, py, pz)
    p.sphere(3)
    p.pop()
  },

  // Draw text that always faces camera (billboard)
  drawBillboardText: (
    p: any,
    text: string,
    x: number,
    y: number,
    z: number,
    size: number,
    color: string
  ) => {
    p.push()
    p.translate(x, y, z)

    // Undo camera rotation to face camera
    // This requires knowing the camera rotation from context
    // For now, just draw on XY plane
    p.fill(color)
    p.textSize(size)
    p.textAlign(p.CENTER, p.CENTER)
    p.text(text, 0, 0)
    p.pop()
  },

  // Create a burst of particles (for match celebration)
  createBurst: (
    count: number,
    origin: { x: number; y: number; z: number },
    minSpeed: number,
    maxSpeed: number
  ) => {
    const particles = []

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed)

      particles.push({
        x: origin.x,
        y: origin.y,
        z: origin.z,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed,
        vz: Math.cos(phi) * speed,
        life: 1,
        size: 2 + Math.random() * 4,
        color: Math.random() > 0.5 ? 'coral' : 'gold',
      })
    }

    return particles
  },
}
