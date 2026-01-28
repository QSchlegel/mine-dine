'use client'

import React, { createContext, useContext, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Context for tabs
interface TabsContextValue {
  value: string
  onChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

// Main Tabs container
export interface TabsProps {
  /** Currently active tab value */
  value: string
  /** Callback when tab changes */
  onChange: (value: string) => void
  /** Tab style variant */
  variant?: 'default' | 'pills' | 'underline'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
  children: React.ReactNode
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  onChange,
  variant = 'default',
  size = 'md',
  className,
  children,
}) => {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={cn('w-full', className)} data-variant={variant} data-size={size}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

// Tab list container
export interface TabListProps {
  className?: string
  children: React.ReactNode
}

export const TabList: React.FC<TabListProps> = ({ className, children }) => {
  return (
    <div
      role="tablist"
      className={cn(
        'flex border-b border-[var(--border)]',
        className
      )}
    >
      {children}
    </div>
  )
}

// Individual tab trigger
export interface TabTriggerProps {
  value: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export const TabTrigger: React.FC<TabTriggerProps> = ({
  value,
  icon,
  badge,
  disabled = false,
  className,
  children,
}) => {
  const { value: activeValue, onChange } = useTabsContext()
  const isActive = value === activeValue

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2',
        isActive
          ? 'text-[var(--foreground)]'
          : 'text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {icon}
      {children}
      {badge !== undefined && (
        <span
          className={cn(
            'ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium',
            isActive
              ? 'bg-coral-100 text-coral-700 dark:bg-coral-500/20 dark:text-coral-400'
              : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
          )}
        >
          {badge}
        </span>
      )}
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-coral-500 dark:bg-coral-400"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  )
}

// Tab content panel
export interface TabPanelProps {
  value: string
  className?: string
  children: React.ReactNode
}

export const TabPanel: React.FC<TabPanelProps> = ({
  value,
  className,
  children,
}) => {
  const { value: activeValue } = useTabsContext()

  if (value !== activeValue) {
    return null
  }

  return (
    <motion.div
      role="tabpanel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('pt-4', className)}
    >
      {children}
    </motion.div>
  )
}

// Convenience hook for controlled tabs
export function useTabs(defaultValue: string) {
  const [value, setValue] = useState(defaultValue)
  return { value, onChange: setValue }
}
