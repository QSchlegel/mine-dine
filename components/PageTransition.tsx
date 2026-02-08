'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'
import { shouldReduceAnimations, isMobileDevice } from '@/lib/performance'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [skipAnimation, setSkipAnimation] = useState(true) // Default to skip until checked

  // Check device capabilities on mount
  useEffect(() => {
    // Skip animations on mobile or if reduced motion is preferred
    setSkipAnimation(shouldReduceAnimations() || isMobileDevice())
  }, [])

  // Skip animation on mobile or if reduced motion is preferred
  if (skipAnimation) {
    return <>{children}</>
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
