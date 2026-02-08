'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSession } from '@/lib/auth-client'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  Home,
  Utensils,
  Heart,
  Calendar,
  User,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  matchPaths?: string[] // Additional paths that should show this item as active
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/dinners',
    label: 'Dinners',
    icon: Utensils,
  },
  {
    href: '/dashboard/swipe',
    label: 'Discover',
    icon: Heart,
    matchPaths: ['/swipe'],
  },
  {
    href: '/dashboard/bookings',
    label: 'Bookings',
    icon: Calendar,
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: User,
  },
]

export const BottomNav: React.FC = () => {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const reducedMotion = useReducedMotion()

  const isAuthenticated = !!session?.user

  // Hide on scroll down, show on scroll up
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    const scrollingDown = currentScrollY > lastScrollYRef.current
    const scrolledPastThreshold = currentScrollY > 100

    if (scrollingDown && scrolledPastThreshold) {
      setIsVisible(false)
    } else {
      setIsVisible(true)
    }

    lastScrollYRef.current = currentScrollY
  }, [])

  useEffect(() => {
    // Throttle scroll handler
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

  // Don't render for unauthenticated users
  if (!isAuthenticated) return null

  const isActive = (item: NavItem) => {
    if (pathname === item.href) return true
    if (item.href !== '/' && pathname.startsWith(item.href)) return true
    if (item.matchPaths?.some(path => pathname.startsWith(path))) return true
    return false
  }

  // Use simpler transitions when reduced motion is preferred
  const navTransition = reducedMotion
    ? { duration: 0.15 }
    : { type: 'spring' as const, stiffness: 200, damping: 25 }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={navTransition}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-40',
            'md:hidden', // Only show on mobile
            'glass-strong',
            'border-t border-[var(--border)]',
            'pb-[env(safe-area-inset-bottom)]' // Safe area for notched phones
          )}
        >
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const active = isActive(item)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center flex-1 h-full"
                >
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center',
                      'rounded-xl px-3 py-1.5',
                      'transition-colors duration-150'
                    )}
                  >
                    {/* Active background indicator - static on mobile for perf */}
                    {active && (
                      <div className="absolute inset-1 rounded-xl bg-coral-500/15" />
                    )}

                    {/* Icon - no animation, just CSS transition */}
                    <Icon
                      className={cn(
                        'w-6 h-6 relative z-10 transition-all duration-150',
                        active
                          ? 'text-coral-500 scale-110'
                          : 'text-[var(--foreground-secondary)] scale-100'
                      )}
                      fill={active && item.icon === Heart ? 'currentColor' : 'none'}
                    />

                    {/* Label */}
                    <span
                      className={cn(
                        'text-[10px] font-medium mt-0.5 relative z-10 transition-colors duration-150',
                        active
                          ? 'text-coral-500'
                          : 'text-[var(--foreground-secondary)]'
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}

export default BottomNav
