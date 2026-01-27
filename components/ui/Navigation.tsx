'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { UserMenu } from './UserMenu'
import { useSession, signOut } from '@/lib/auth-client'
import {
  Calendar,
  MessageSquare,
  User,
  Heart,
  ChefHat,
  LogOut,
  Home,
  Utensils,
} from 'lucide-react'

interface NavLink {
  href: string
  label: string
  icon?: React.ReactNode
}

// Public navigation links
const publicNavLinks: NavLink[] = [
  { href: '/dinners', label: 'Browse Dinners', icon: <Utensils className="h-4 w-4" /> },
  { href: '/swipe', label: 'Discover Hosts', icon: <Heart className="h-4 w-4" /> },
]

// Authenticated user navigation links
const authNavLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
  { href: '/dinners', label: 'Browse Dinners', icon: <Utensils className="h-4 w-4" /> },
  { href: '/dashboard/swipe', label: 'Discover', icon: <Heart className="h-4 w-4" /> },
]

// Mobile menu links for authenticated users
const mobileAuthLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
  { href: '/dashboard/bookings', label: 'My Bookings', icon: <Calendar className="h-4 w-4" /> },
  { href: '/dashboard/messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
  { href: '/dashboard/swipe', label: 'Discover Hosts', icon: <Heart className="h-4 w-4" /> },
  { href: '/dashboard/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  { href: '/dashboard/host/apply', label: 'Become a Host', icon: <ChefHat className="h-4 w-4" /> },
]

export const Navigation: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const isAuthenticated = !!session?.user
  const user = session?.user

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
      setIsMobileMenuOpen(false)
    }
  }

  const navLinks = isAuthenticated ? authNavLinks : publicNavLinks

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40',
          'transition-all duration-300',
          isScrolled
            ? 'glass-strong py-3 shadow-lg'
            : 'bg-transparent py-4'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 group">
              <motion.span
                className={cn(
                  'text-2xl font-bold tracking-tight',
                  'bg-gradient-to-r from-coral-500 to-coral-400 bg-clip-text text-transparent'
                )}
                whileHover={{ scale: 1.02 }}
              >
                Mine Dine
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavItem
                  key={link.href}
                  href={link.href}
                  isActive={pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))}
                >
                  {link.label}
                </NavItem>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Desktop Auth Section */}
              <div className="hidden md:flex items-center gap-2">
                {isPending ? (
                  // Loading skeleton
                  <div className="h-10 w-24 rounded-full bg-[var(--background-secondary)] animate-pulse" />
                ) : isAuthenticated && user ? (
                  // Authenticated: Show profile icon and user menu
                  <>
                    <Button
                      variant="ghost"
                      size="md"
                      href="/dashboard/profile"
                      className={cn(
                        '!px-3',
                        pathname === '/dashboard/profile' && 'bg-[var(--background-secondary)]'
                      )}
                      aria-label="Profile"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                    <UserMenu user={user} />
                  </>
                ) : (
                  // Not authenticated: Show login/signup buttons
                  <>
                    <Button variant="ghost" size="sm" href="/login">
                      Log In
                    </Button>
                    <Button size="sm" href="/signup">
                      Get Started
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                className={cn(
                  'md:hidden p-2 rounded-lg',
                  'hover:bg-[var(--background-secondary)]',
                  'transition-colors'
                )}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                whileTap={{ scale: 0.95 }}
              >
                <MenuIcon isOpen={isMobileMenuOpen} />
              </motion.button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              className={cn(
                'fixed top-0 right-0 bottom-0 z-30 w-80 md:hidden',
                'bg-[var(--background)] border-l border-[var(--border)]',
                'overflow-y-auto'
              )}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="p-6 pt-20 space-y-6">
                {/* User Info (if authenticated) */}
                {isAuthenticated && user && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background-secondary)]">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={cn(
                          'h-12 w-12 rounded-full flex items-center justify-center',
                          'bg-gradient-to-br from-coral-500 to-pink-500 text-white',
                          'text-lg font-semibold'
                        )}
                      >
                        {user.name
                          ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                          : user.email?.[0].toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--foreground)] truncate">
                        {user.name || user.email?.split('@')[0] || 'User'}
                      </p>
                      {user.email && (
                        <p className="text-sm text-[var(--foreground-secondary)] truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                {isAuthenticated ? (
                  // Authenticated mobile menu
                  <div className="space-y-1">
                    {mobileAuthLinks.map((link) => (
                      <MobileNavItem
                        key={link.href}
                        href={link.href}
                        icon={link.icon}
                        isActive={pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))}
                      >
                        {link.label}
                      </MobileNavItem>
                    ))}
                  </div>
                ) : (
                  // Unauthenticated mobile menu
                  <>
                    <div className="space-y-1">
                      {publicNavLinks.map((link) => (
                        <MobileNavItem
                          key={link.href}
                          href={link.href}
                          icon={link.icon}
                          isActive={pathname === link.href}
                        >
                          {link.label}
                        </MobileNavItem>
                      ))}
                    </div>

                    <div className="h-px bg-[var(--border)]" />

                    {/* Auth buttons for unauthenticated */}
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" href="/login">
                        Log In
                      </Button>
                      <Button className="w-full" href="/signup">
                        Get Started
                      </Button>
                    </div>
                  </>
                )}

                {/* Sign Out (if authenticated) */}
                {isAuthenticated && (
                  <>
                    <div className="h-px bg-[var(--border)]" />
                    <button
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-3 rounded-lg',
                        'text-left text-base font-medium',
                        'text-danger-600 hover:bg-danger-500/10',
                        'transition-colors duration-150',
                        'disabled:opacity-50'
                      )}
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                    >
                      <LogOut className="h-5 w-5" />
                      <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Desktop nav item
interface NavItemProps {
  href: string
  isActive: boolean
  children: React.ReactNode
}

const NavItem: React.FC<NavItemProps> = ({ href, isActive, children }) => (
  <Link
    href={href}
    className={cn(
      'relative px-4 py-2 text-sm font-medium rounded-lg',
      'transition-colors duration-200',
      isActive
        ? 'text-coral-500'
        : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
    )}
  >
    {children}
    {isActive && (
      <motion.div
        className="absolute bottom-0 left-2 right-2 h-0.5 bg-coral-500 rounded-full"
        layoutId="nav-indicator"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    )}
  </Link>
)

// Mobile nav item
interface MobileNavItemProps {
  href: string
  isActive: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({ href, isActive, icon, children }) => (
  <Link
    href={href}
    className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium',
      'transition-colors duration-200',
      isActive
        ? 'bg-coral-500/10 text-coral-500'
        : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]'
    )}
  >
    {icon && <span className={isActive ? 'text-coral-500' : 'text-[var(--foreground-secondary)]'}>{icon}</span>}
    {children}
  </Link>
)

// Hamburger menu icon with animation
const MenuIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg
    className="h-6 w-6 text-[var(--foreground)]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <AnimatePresence mode="wait" initial={false}>
      {isOpen ? (
        <motion.g
          key="close"
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </motion.g>
      ) : (
        <motion.g
          key="menu"
          initial={{ opacity: 0, rotate: 90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: -90 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </motion.g>
      )}
    </AnimatePresence>
  </svg>
)
