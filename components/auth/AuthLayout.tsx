'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'

export interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[var(--background-secondary)] px-4 py-6 sm:py-12 pb-[env(safe-area-inset-bottom)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        {/* Mobile: minimal card styling, Desktop: full card */}
        <Card className="p-5 sm:p-8 space-y-6 sm:space-y-8 border-0 sm:border shadow-none sm:shadow-lg bg-transparent sm:bg-[var(--background-elevated)]">
          {/* Branding Section - more compact on mobile */}
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2 bg-gradient-to-r from-coral-500 to-coral-400 bg-clip-text text-transparent"
            >
              Mine Dine
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base text-[var(--foreground-secondary)]"
            >
              {subtitle || title}
            </motion.p>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {children}
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}
