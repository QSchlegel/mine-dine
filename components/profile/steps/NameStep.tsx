'use client'

import { motion } from 'framer-motion'
import { Input } from '@/components/ui/Input'
import { Check } from 'lucide-react'
import { fadeInUp } from '@/lib/animations'

interface NameStepProps {
  name: string
  onChange: (name: string) => void
  isValid: boolean
}

export default function NameStep({ name, onChange, isValid }: NameStepProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="space-y-3 sm:space-y-4"
    >
      <Input
        label="Name"
        value={name}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your name"
        error={name.length > 0 && name.length < 2 ? 'Name must be at least 2 characters' : undefined}
        hint={isValid ? undefined : 'Minimum 2 characters required'}
        rightIcon={isValid ? <Check className="h-5 w-5 text-green-500" /> : undefined}
        autoFocus
      />

      {isValid && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-green-500"
        >
          <Check className="h-4 w-4" />
          <span>Name looks good!</span>
        </motion.div>
      )}

      <p className="text-xs text-[var(--foreground-muted)] mt-3 sm:mt-4">
        This helps hosts personalize your experience and make you feel welcome.
      </p>
    </motion.div>
  )
}
