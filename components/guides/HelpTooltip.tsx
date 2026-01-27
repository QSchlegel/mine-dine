'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpTooltipProps {
  content: ReactNode | string
  title?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  children?: ReactNode
}

export default function HelpTooltip({
  content,
  title,
  placement = 'top',
  className,
  children,
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--background-elevated)] border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--background-elevated)] border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--background-elevated)] border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--background-elevated)] border-t-transparent border-b-transparent border-l-transparent',
  }

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children || (
        <button
          type="button"
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-foreground-muted hover:text-foreground transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-64 p-4 rounded-lg shadow-lg border border-border',
              'bg-[var(--background-elevated)]',
              placementClasses[placement]
            )}
            role="tooltip"
          >
            {title && (
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-foreground-muted hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="text-sm text-foreground-secondary">
              {typeof content === 'string' ? <p>{content}</p> : content}
            </div>
            {/* Arrow */}
            <div
              className={cn(
                'absolute w-0 h-0 border-4',
                arrowClasses[placement]
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
