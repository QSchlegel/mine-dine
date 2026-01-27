'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X } from 'lucide-react'
import HelpOverlay from './HelpOverlay'
import { useHelpShortcut } from '@/hooks/useHelpShortcut'

interface HelpButtonProps {
  pageId: string
  className?: string
}

export default function HelpButton({ pageId, className }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  useHelpShortcut({
    onOpen: () => setIsOpen(true),
    enabled: !isOpen,
  })

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-primary-500 text-white hover:bg-primary-600 transition-colors ${className || ''}`}
        aria-label="Get help"
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <HelpOverlay pageId={pageId} onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
