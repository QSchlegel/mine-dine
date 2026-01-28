'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Context
interface ToastContextValue {
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

// Hook to use toasts
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  const toast = useCallback((options: Omit<ToastData, 'id'>) => {
    return context.addToast(options)
  }, [context])

  return {
    toast,
    success: (title: string, description?: string) =>
      toast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      toast({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      toast({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      toast({ type: 'info', title, description }),
    dismiss: context.removeToast,
    dismissAll: context.clearToasts,
  }
}

// Provider
export interface ToastProviderProps {
  children: React.ReactNode
  /** Position of toasts */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  /** Default duration in ms */
  defaultDuration?: number
  /** Maximum toasts visible */
  maxToasts?: number
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'bottom-right',
  defaultDuration = 5000,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: ToastData = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration,
    }

    setToasts((prev) => {
      const updated = [...prev, newToast]
      return updated.slice(-maxToasts)
    })

    // Auto remove
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [defaultDuration, maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <div
        className={cn(
          'fixed z-[100] flex flex-col gap-2 pointer-events-none',
          positionClasses[position],
          position.includes('bottom') ? 'flex-col-reverse' : 'flex-col'
        )}
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// Individual Toast component
interface ToastProps extends ToastData {
  onDismiss: () => void
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    containerClass: 'border-success-200 dark:border-success-500/30',
    iconClass: 'text-success-500 dark:text-success-400',
    progressClass: 'bg-success-500',
  },
  error: {
    icon: AlertCircle,
    containerClass: 'border-danger-200 dark:border-danger-500/30',
    iconClass: 'text-danger-500 dark:text-danger-400',
    progressClass: 'bg-danger-500',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-amber-200 dark:border-amber-500/30',
    iconClass: 'text-amber-500 dark:text-amber-400',
    progressClass: 'bg-amber-500',
  },
  info: {
    icon: Info,
    containerClass: 'border-accent-200 dark:border-accent-500/30',
    iconClass: 'text-accent-500 dark:text-accent-400',
    progressClass: 'bg-accent-500',
  },
}

const Toast: React.FC<ToastProps> = ({
  type,
  title,
  description,
  action,
  duration,
  onDismiss,
}) => {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'pointer-events-auto w-80 max-w-full overflow-hidden rounded-xl border',
        'bg-[var(--background-elevated)] shadow-lg',
        config.containerClass
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClass)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {title}
          </p>
          {description && (
            <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
              {description}
            </p>
          )}
          {action && (
            <button
              onClick={() => {
                action.onClick()
                onDismiss()
              }}
              className={cn(
                'mt-2 text-sm font-medium',
                config.iconClass,
                'hover:underline'
              )}
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className={cn(
            'flex-shrink-0 rounded-lg p-1 -m-1',
            'text-[var(--foreground-muted)] hover:text-[var(--foreground)]',
            'hover:bg-[var(--background-secondary)]',
            'transition-colors'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {duration && duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={cn('h-1', config.progressClass)}
        />
      )}
    </motion.div>
  )
}
