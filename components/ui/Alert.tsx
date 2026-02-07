'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alert variant determines color scheme */
  variant?: 'info' | 'success' | 'warning' | 'error'
  /** Surface style */
  surface?: 'solid' | 'glass'
  /** Alert title */
  title?: string
  /** Whether the alert can be dismissed */
  dismissible?: boolean
  /** Callback when dismissed */
  onDismiss?: () => void
  /** Optional icon override */
  icon?: React.ReactNode
  /** Optional actions/buttons */
  actions?: React.ReactNode
}

const variantConfig = {
  info: {
    container: 'bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800/30',
    icon: 'text-accent-600 dark:text-accent-400',
    title: 'text-accent-900 dark:text-accent-200',
    content: 'text-accent-800 dark:text-accent-300',
    dismiss: 'text-accent-600 dark:text-accent-400 hover:text-accent-800 dark:hover:text-accent-300',
    IconComponent: Info,
  },
  success: {
    container: 'bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20',
    icon: 'text-success-600 dark:text-success-400',
    title: 'text-success-900 dark:text-success-200',
    content: 'text-success-800 dark:text-success-300',
    dismiss: 'text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-300',
    IconComponent: CheckCircle,
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-200',
    content: 'text-amber-800 dark:text-amber-300',
    dismiss: 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300',
    IconComponent: AlertTriangle,
  },
  error: {
    container: 'bg-danger-50 dark:bg-danger-500/10 border-danger-200 dark:border-danger-500/20',
    icon: 'text-danger-600 dark:text-danger-400',
    title: 'text-danger-900 dark:text-danger-200',
    content: 'text-danger-800 dark:text-danger-300',
    dismiss: 'text-danger-600 dark:text-danger-400 hover:text-danger-800 dark:hover:text-danger-300',
    IconComponent: AlertCircle,
  },
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({
    className,
    variant = 'info',
    surface = 'solid',
    title,
    dismissible = false,
    onDismiss,
    icon,
    actions,
    children,
    ...props
  }, ref) => {
    const config = variantConfig[variant]
    const IconComponent = config.IconComponent

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative rounded-xl border p-4 sm:p-6',
          'transition-colors duration-200',
          surface === 'glass'
            ? cn('glass', 'backdrop-blur-lg', 'border-[var(--glass-border)]', 'shadow-sm hover:shadow-md')
            : config.container,
          className
        )}
        {...props}
      >
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'absolute top-3 right-3 p-1 rounded-lg transition-colors',
              'hover:bg-black/5 dark:hover:bg-white/5',
              config.dismiss
            )}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-start gap-3">
          <div className={cn('flex-shrink-0 mt-0.5', config.icon)}>
            {icon || <IconComponent className="h-5 w-5" />}
          </div>

          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={cn('font-semibold mb-1', config.title)}>
                {title}
              </h3>
            )}
            {children && (
              <div className={cn('text-sm', config.content)}>
                {children}
              </div>
            )}
            {actions && (
              <div className="mt-4 flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

Alert.displayName = 'Alert'

// Animated dismissible alert wrapper
export interface AnimatedAlertProps extends AlertProps {
  isVisible?: boolean
}

export const AnimatedAlert: React.FC<AnimatedAlertProps> = ({
  isVisible = true,
  ...props
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Alert {...props} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
