'use client'

import { motion } from 'framer-motion'
import { Sparkles, PenTool } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PlanningMode = 'manual' | 'ai'

interface PlanModeToggleProps {
  mode: PlanningMode
  onChange: (mode: PlanningMode) => void
  className?: string
}

export default function PlanModeToggle({
  mode,
  onChange,
  className,
}: PlanModeToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 p-1 rounded-lg bg-background-secondary border border-border',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange('manual')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-md transition-all',
          mode === 'manual'
            ? 'bg-primary-500 text-white shadow-md'
            : 'text-foreground-secondary hover:text-foreground hover:bg-background-elevated'
        )}
      >
        <PenTool className="w-4 h-4" />
        <span className="font-medium">Manual</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('ai')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-md transition-all',
          mode === 'ai'
            ? 'bg-primary-500 text-white shadow-md'
            : 'text-foreground-secondary hover:text-foreground hover:bg-background-elevated'
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span className="font-medium">AI Plan Mode</span>
      </button>
    </div>
  )
}
