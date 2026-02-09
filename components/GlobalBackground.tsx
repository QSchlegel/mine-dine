'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useInteraction } from '@/hooks/useInteraction'
import { shouldSkipHeavyEffects, isMobileDevice } from '@/lib/performance'

// Lazy load background components only when needed
import dynamic from 'next/dynamic'

const P5ParticleBackground = dynamic(() => import('@/components/P5ParticleBackground'), { ssr: false })
const GradientWavesBackground = dynamic(() => import('@/components/backgrounds/GradientWavesBackground'), { ssr: false })
const GeometricGridBackground = dynamic(() => import('@/components/backgrounds/GeometricGridBackground'), { ssr: false })
const MeshGradientBackground = dynamic(() => import('@/components/backgrounds/MeshGradientBackground'), { ssr: false })
const RadialGradientBackground = dynamic(() => import('@/components/backgrounds/RadialGradientBackground'), { ssr: false })
const WavePatternBackground = dynamic(() => import('@/components/backgrounds/WavePatternBackground'), { ssr: false })
const FloatingFoodBackground = dynamic(() => import('@/components/backgrounds/FloatingFoodBackground'), { ssr: false })

type AnimationType = 'particles' | 'waves' | 'geometric' | 'mesh' | 'radial' | 'wave-pattern' | 'floating-food' | 'none'

const ANIMATION_MAP: Record<string, AnimationType> = {
  '/': 'waves',
  '/login': 'waves',
  '/signup': 'waves',
  '/dashboard': 'geometric',
  '/dinners': 'mesh',
  '/swipe': 'waves',
  '/dashboard/swipe': 'geometric',
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
  const [skipAnimations, setSkipAnimations] = useState(true) // Default to skip until checked

  // Check device capabilities on mount
  useEffect(() => {
    const shouldSkip = shouldSkipHeavyEffects() || isMobileDevice()
    setSkipAnimations(shouldSkip)
  }, [])

  // Determine animation type based on pathname
  const getAnimationType = (): AnimationType => {
    // Skip all animations on mobile/low-end devices
    if (skipAnimations) {
      return 'none'
    }

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
  const interaction = useInteraction({ enabled: animationType === 'particles' })

  // Render static gradient fallback on mobile
  if (animationType === 'none') {
    return (
      <div
        className="fixed inset-0 -z-10 pointer-events-none bg-[var(--background)]"
        aria-hidden="true"
      />
    )
  }

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
