'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AuthAlertProps {
  message: string
  type?: 'error' | 'success' | 'warning' | 'info'
  className?: string
}

const alertConfig = {
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-700 dark:text-red-300',
    titleColor: 'text-red-900 dark:text-red-100',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    textColor: 'text-green-700 dark:text-green-300',
    titleColor: 'text-green-900 dark:text-green-100',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-700 dark:text-amber-300',
    titleColor: 'text-amber-900 dark:text-amber-100',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-700 dark:text-blue-300',
    titleColor: 'text-blue-900 dark:text-blue-100',
  },
}

export const AuthAlert: React.FC<AuthAlertProps> = ({ message, type = 'error', className }) => {
  if (!message) return null

  const config = alertConfig[type]
  const Icon = config.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={cn(
            config.bgColor,
            config.borderColor,
            'border',
            className
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconColor)} />
              <p className={cn('text-sm font-medium', config.textColor)}>
                {message}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
