'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ArrowUp } from 'lucide-react'

export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  const handleScroll = useCallback(() => {
    setIsVisible(window.scrollY > 400)
  }, [])

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [handleScroll])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        'fixed z-30 p-3 rounded-full',
        'bg-[var(--background-elevated)] border border-[var(--border)]',
        'shadow-lg hover:shadow-xl',
        'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2',
        'bottom-6 right-6 md:bottom-8 md:right-8',
        'max-md:left-4 max-md:right-auto max-md:bottom-20',
        isVisible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
