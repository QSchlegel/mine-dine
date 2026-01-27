'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useInteraction } from '@/hooks/useInteraction'
import {
  UtensilsCrossed,
  ChefHat,
  Circle,
  Sparkles,
  Flame,
} from 'lucide-react'

interface FloatingIconProps {
  icon: ReactNode
  depth: number // 0.2 = far background, 1.0 = foreground (more movement)
  position: {
    top?: string
    left?: string
    right?: string
    bottom?: string
  }
  size: string // Tailwind size class like "w-12 h-12"
  color: string // Tailwind color class
  delay?: number // Animation delay in seconds
  floatAmplitude?: number // How much it floats up/down
}

function FloatingIcon({
  icon,
  depth,
  position,
  size,
  color,
  delay = 0,
  floatAmplitude = 10,
}: FloatingIconProps) {
  const interaction = useInteraction({
    smoothing: 0.05 + (1 - depth) * 0.1, // Deeper elements smooth more slowly
    enabled: true,
  })

  // Use springs for silky smooth parallax
  const springConfig = { stiffness: 100, damping: 20 }
  const x = useSpring(0, springConfig)
  const y = useSpring(0, springConfig)

  // Track if component is mounted
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Update parallax offset based on interaction
  useEffect(() => {
    if (interaction.isReducedMotion) {
      x.set(0)
      y.set(0)
      return
    }

    const maxOffset = 50 * depth // Higher depth = more movement

    // Combine mouse and gyroscope input
    const inputX =
      interaction.isMobile && interaction.hasGyroscope
        ? interaction.tiltX
        : interaction.x
    const inputY =
      interaction.isMobile && interaction.hasGyroscope
        ? interaction.tiltY
        : interaction.y

    x.set(inputX * maxOffset)
    y.set(inputY * maxOffset)
  }, [
    interaction.x,
    interaction.y,
    interaction.tiltX,
    interaction.tiltY,
    interaction.isMobile,
    interaction.hasGyroscope,
    interaction.isReducedMotion,
    depth,
    x,
    y,
  ])

  // Skip animations for reduced motion
  if (interaction.isReducedMotion) {
    return (
      <div
        className={`absolute ${size} ${color}`}
        style={{ ...position, zIndex: 2 }}
        aria-hidden="true"
      >
        {icon}
      </div>
    )
  }

  return (
    <motion.div
      className={`absolute ${size} ${color}`}
      style={{
        ...position,
        x,
        y,
        zIndex: 2,
      }}
      // Combine parallax with float animation
      animate={{
        translateY: [0, -floatAmplitude * depth, 0],
      }}
      transition={{
        duration: 6 / depth, // Slower for background elements
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      aria-hidden="true"
    >
      {icon}
    </motion.div>
  )
}

export interface InteractiveFloatingIconsProps {
  className?: string
}

export default function InteractiveFloatingIcons({
  className = '',
}: InteractiveFloatingIconsProps) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      {/* UtensilsCrossed - top left, medium depth */}
      <FloatingIcon
        icon={<UtensilsCrossed className="w-full h-full" />}
        depth={0.6}
        position={{ top: '20%', left: '10%' }}
        size="w-12 h-12"
        color="text-pink-500/40"
        delay={0}
        floatAmplitude={12}
      />

      {/* ChefHat - bottom right, high depth (more movement) */}
      <FloatingIcon
        icon={<ChefHat className="w-full h-full" />}
        depth={0.8}
        position={{ bottom: '32%', right: '15%' }}
        size="w-16 h-16"
        color="text-pink-500/40"
        delay={1}
        floatAmplitude={15}
      />

      {/* Circle - top right, low depth (subtle movement) */}
      <FloatingIcon
        icon={<Circle className="w-full h-full fill-cyan-500/20" />}
        depth={0.4}
        position={{ top: '33%', right: '10%' }}
        size="w-10 h-10"
        color="text-cyan-500/40"
        delay={2}
        floatAmplitude={8}
      />

      {/* Sparkles - bottom left, medium depth */}
      <FloatingIcon
        icon={<Sparkles className="w-full h-full" />}
        depth={0.5}
        position={{ bottom: '25%', left: '15%' }}
        size="w-8 h-8"
        color="text-purple-400/50"
        delay={0.5}
        floatAmplitude={10}
      />

      {/* Flame - middle right, high depth */}
      <FloatingIcon
        icon={<Flame className="w-full h-full" />}
        depth={0.7}
        position={{ top: '50%', right: '20%' }}
        size="w-14 h-14"
        color="text-pink-500/40"
        delay={1.5}
        floatAmplitude={14}
      />

      {/* Additional decorative elements at various depths */}
      <FloatingIcon
        icon={<Circle className="w-full h-full fill-purple-400/15" />}
        depth={0.3}
        position={{ top: '15%', right: '25%' }}
        size="w-6 h-6"
        color="text-purple-400/30"
        delay={0.8}
        floatAmplitude={6}
      />

      <FloatingIcon
        icon={<Sparkles className="w-full h-full" />}
        depth={0.9}
        position={{ top: '40%', left: '8%' }}
        size="w-10 h-10"
        color="text-cyan-400/30"
        delay={2.2}
        floatAmplitude={16}
      />
    </div>
  )
}
