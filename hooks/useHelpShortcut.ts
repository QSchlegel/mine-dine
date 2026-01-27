'use client'

import { useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

interface UseHelpShortcutOptions {
  onOpen: () => void
  enabled?: boolean
}

export function useHelpShortcut({ onOpen, enabled = true }: UseHelpShortcutOptions) {
  useHotkeys(
    '?',
    (e) => {
      e.preventDefault()
      if (enabled) {
        onOpen()
      }
    },
    { enabled }
  )
}
