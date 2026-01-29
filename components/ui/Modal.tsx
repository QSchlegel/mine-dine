'use client'

import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { modalBackdrop, modalContent } from '@/lib/animations'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  /** Makes modal fullscreen on mobile devices */
  mobileFullscreen?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  mobileFullscreen = false,
}) => {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose()
      }
    },
    [onClose, closeOnEscape]
  )

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, handleEscape])

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          mobileFullscreen ? "p-0 sm:p-4" : "p-4"
        )}>
          {/* Backdrop */}
          <motion.div
            className={cn(
              "fixed inset-0 bg-black/60 backdrop-blur-sm",
              mobileFullscreen && "sm:bg-black/60 bg-black/0"
            )}
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* Modal Content */}
          <motion.div
            className={cn(
              'relative z-50 w-full overflow-hidden',
              'bg-[var(--background-elevated)]',
              'border border-[var(--border)]',
              'shadow-lg dark:shadow-2xl',
              // Mobile fullscreen mode
              mobileFullscreen ? [
                'h-full sm:h-auto',
                'rounded-none sm:rounded-2xl',
                'border-0 sm:border',
                'max-h-[100dvh] sm:max-h-[calc(100vh-2rem)]',
                sizes[size]
              ] : [
                'rounded-2xl',
                sizes[size]
              ]
            )}
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div
                className={cn(
                  'flex items-start justify-between gap-4 p-6',
                  'border-b border-[var(--border)]'
                )}
              >
                <div className="flex-1">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-xl font-semibold text-[var(--foreground)]"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                      {description}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className={cn(
                      'rounded-lg p-2 -m-2',
                      'text-[var(--foreground-muted)]',
                      'hover:text-[var(--foreground)]',
                      'hover:bg-[var(--background-secondary)]',
                      'transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-coral-500'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Close modal"
                  >
                    <CloseIcon />
                  </motion.button>
                )}
              </div>
            )}

            {/* Body */}
            <div className={cn(
              "p-4 sm:p-6 overflow-y-auto",
              mobileFullscreen
                ? "max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100vh-16rem)] pb-[env(safe-area-inset-bottom)]"
                : "max-h-[calc(100vh-16rem)]"
            )}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

// Modal Footer component for actions
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-3 p-6 pt-0',
        'border-t border-[var(--border)] mt-6 -mb-6 -mx-6 px-6 py-4',
        'bg-[var(--background-secondary)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

ModalFooter.displayName = 'ModalFooter'

// Confirmation Modal variant
export interface ConfirmModalProps extends Omit<ModalProps, 'children'> {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  variant?: 'default' | 'danger'
  isLoading?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  variant = 'default',
  isLoading = false,
  ...props
}) => {
  // Import Button dynamically to avoid circular deps
  const Button = require('./Button').Button

  return (
    <Modal onClose={onClose} size="sm" {...props}>
      <p className="text-[var(--foreground-secondary)]">{message}</p>

      <div className="flex items-center justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
