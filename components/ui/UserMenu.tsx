'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { signOut } from '@/lib/auth-client'
import {
  User,
  Calendar,
  MessageSquare,
  ChefHat,
  Settings,
  LogOut,
  Heart,
  ChevronDown,
  Shield,
} from 'lucide-react'

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }
}

interface MenuItem {
  href: string
  label: string
  icon: React.ReactNode
  description?: string
}

const menuItems: MenuItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <Settings className="h-4 w-4" />,
    description: 'Your home base',
  },
  {
    href: '/dashboard/bookings',
    label: 'My Bookings',
    icon: <Calendar className="h-4 w-4" />,
    description: 'View reservations',
  },
  {
    href: '/dashboard/messages',
    label: 'Messages',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Chat with hosts',
  },
  {
    href: '/dashboard/swipe',
    label: 'Discover Hosts',
    icon: <Heart className="h-4 w-4" />,
    description: 'Find your match',
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: <User className="h-4 w-4" />,
    description: 'Edit your profile',
  },
]

export const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.image || null)

  const isModerator = user.role === 'MODERATOR' || user.role === 'ADMIN'
  const isAdmin = user.role === 'ADMIN'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    let isMounted = true
    fetch('/api/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return
        const url = data.profile?.profileImageUrl || data.profile?.profileImagePublicUrl
        if (url) setAvatarUrl(url)
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

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
      setIsOpen(false)
    }
  }

  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const displayName = user.name || user.email?.split('@')[0] || 'User'

  return (
    <div className="relative" ref={menuRef}>
      <button
        className={cn(
          'flex items-center gap-2 p-1.5 pr-3 rounded-full',
          'bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)]',
          'border border-[var(--border)]',
          'transition-colors duration-200 active:scale-[0.98]'
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {avatarUrl ? (
          <img
            src={getProxiedImageUrl(avatarUrl) ?? avatarUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-coral-500 to-pink-500 text-white',
              'text-sm font-semibold'
            )}
          >
            {getInitials()}
          </div>
        )}

        <span className="hidden sm:block text-sm font-medium text-[var(--foreground)] max-w-24 truncate">
          {displayName}
        </span>
        <ChevronDown
          className={cn(
            'hidden sm:block h-4 w-4 text-[var(--foreground-secondary)] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'absolute right-0 mt-2 w-72 rounded-xl overflow-hidden',
          'bg-[var(--background)] border border-[var(--border)]',
          'shadow-xl shadow-black/10 z-50',
          'transition-all duration-150 origin-top-right',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        )}
      >
        <div className="p-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={getProxiedImageUrl(avatarUrl) ?? avatarUrl}
                alt={displayName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center',
                  'bg-gradient-to-br from-coral-500 to-pink-500 text-white',
                  'text-sm font-semibold'
                )}
              >
                {getInitials()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                {displayName}
              </p>
              {user.email && (
                <p className="text-xs text-[var(--foreground-secondary)] truncate">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="py-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                'hover:bg-[var(--background-secondary)]',
                'transition-colors duration-150'
              )}
              onClick={() => setIsOpen(false)}
            >
              <span className="text-[var(--foreground-secondary)]">{item.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                {item.description && (
                  <p className="text-xs text-[var(--foreground-secondary)]">{item.description}</p>
                )}
              </div>
            </Link>
          ))}

          {isModerator && (
            <Link
              href="/dashboard/moderator"
              className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                'hover:bg-[var(--background-secondary)]',
                'transition-colors duration-150',
                'border-t border-[var(--border)] mt-2 pt-2'
              )}
              onClick={() => setIsOpen(false)}
            >
              <span className="text-[var(--foreground-secondary)]">
                <Shield className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">Moderator Dashboard</p>
                <p className="text-xs text-[var(--foreground-secondary)]">Review applications & dinners</p>
              </div>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                'hover:bg-[var(--background-secondary)]',
                'transition-colors duration-150',
                'border-t border-[var(--border)] mt-2 pt-2'
              )}
              onClick={() => setIsOpen(false)}
            >
              <span className="text-[var(--foreground-secondary)]">
                <Shield className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">Admin Dashboard</p>
                <p className="text-xs text-[var(--foreground-secondary)]">Platform controls & payouts</p>
              </div>
            </Link>
          )}
        </div>

        <div className="px-3 py-2 border-t border-[var(--border)]">
          <Link
            href="/dashboard/host/apply"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'bg-gradient-to-r from-amber-500/10 to-orange-500/10',
              'hover:from-amber-500/20 hover:to-orange-500/20',
              'border border-amber-500/20',
              'transition-all duration-150'
            )}
            onClick={() => setIsOpen(false)}
          >
            <ChefHat className="h-4 w-4 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Become a Host</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-500/80">Share your culinary passion</p>
            </div>
          </Link>
        </div>

        <div className="p-2 border-t border-[var(--border)]">
          <button
            className={cn(
              'flex items-center gap-3 w-full px-4 py-2.5 rounded-lg',
              'text-left text-sm font-medium',
              'text-danger-600 hover:bg-danger-500/10',
              'transition-colors duration-150',
              'disabled:opacity-50'
            )}
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-4 w-4" />
            <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
