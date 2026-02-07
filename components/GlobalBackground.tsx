'use client'

import { usePathname } from 'next/navigation'
import { useInteraction } from '@/hooks/useInteraction'
import P5ParticleBackground from '@/components/P5ParticleBackground'
import GradientWavesBackground from '@/components/backgrounds/GradientWavesBackground'
import GeometricGridBackground from '@/components/backgrounds/GeometricGridBackground'
import MeshGradientBackground from '@/components/backgrounds/MeshGradientBackground'
import RadialGradientBackground from '@/components/backgrounds/RadialGradientBackground'
import WavePatternBackground from '@/components/backgrounds/WavePatternBackground'
import FloatingFoodBackground from '@/components/backgrounds/FloatingFoodBackground'

type AnimationType = 'particles' | 'waves' | 'geometric' | 'mesh' | 'radial' | 'wave-pattern' | 'floating-food'

const ANIMATION_MAP: Record<string, AnimationType> = {
  '/': 'particles',
  '/login': 'waves',
  '/signup': 'waves',
  '/dashboard': 'geometric',
  '/dinners': 'mesh',
  '/swipe': 'particles',
  '/dashboard/swipe': 'particles',
  '/dashboard/profile': 'radial',
  '/dashboard/bookings': 'wave-pattern',
  '/dashboard/messages': 'mesh',
  '/dashboard/host': 'geometric',
  '/dashboard/moderator': 'geometric',
  '/recipes': 'floating-food',
  '/minebot': 'floating-food',
  '/dashboard/meal-planner': 'floating-food',
}

export default function GlobalBackground() {
  const pathname = usePathname()
  const interaction = useInteraction()

  // Determine animation type based on pathname
  const getAnimationType = (): AnimationType => {
    // Check exact matches first
    if (ANIMATION_MAP[pathname]) {
      return ANIMATION_MAP[pathname]
    }

    // Check path prefixes for nested routes (longest match first)
    const sortedPaths = Object.entries(ANIMATION_MAP).sort(
      (a, b) => b[0].length - a[0].length
    )

    for (const [path, animation] of sortedPaths) {
      if (pathname.startsWith(path)) {
        return animation
      }
    }

    // Default fallback
    return 'waves'
  }

  const animationType = getAnimationType()

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {animationType === 'particles' && (
        <P5ParticleBackground
          interactionState={interaction}
          cursorMode="repel"
          gyroInfluence={0.3}
        />
      )}
      {animationType === 'waves' && <GradientWavesBackground />}
      {animationType === 'geometric' && <GeometricGridBackground />}
      {animationType === 'mesh' && <MeshGradientBackground />}
      {animationType === 'radial' && <RadialGradientBackground />}
      {animationType === 'wave-pattern' && <WavePatternBackground />}
      {animationType === 'floating-food' && <FloatingFoodBackground />}
    </div>
  )
}
