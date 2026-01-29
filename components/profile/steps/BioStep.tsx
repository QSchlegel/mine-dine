'use client'

import { motion } from 'framer-motion'
import { Textarea } from '@/components/ui/Textarea'
import { Check } from 'lucide-react'
import { fadeInUp } from '@/lib/animations'

interface BioStepProps {
  bio: string
  onChange: (bio: string) => void
  isValid: boolean
}

export default function BioStep({ bio, onChange, isValid }: BioStepProps) {
  const remaining = Math.max(0, 20 - bio.length)
  const charCount = bio.length

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="space-y-3 sm:space-y-4"
    >
      <Textarea
        label="Bio"
        value={bio}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tell us about your food preferences, dietary restrictions, and what you're looking for..."
        rows={5}
        maxLength={500}
        showCount
        error={
          charCount > 0 && charCount < 20
            ? `${remaining} more characters needed`
            : undefined
        }
        hint={
          isValid
            ? undefined
            : charCount === 0
            ? 'Write at least 20 characters'
            : `${remaining} more needed`
        }
        autoFocus
      />

      {/* Progress indicator */}
      {charCount > 0 && (
        <div className="space-y-1.5 sm:space-y-2">
          <div className="w-full bg-[var(--background-secondary)] rounded-full h-1.5 sm:h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, (charCount / 20) * 100)}%`,
              }}
              transition={{ duration: 0.3 }}
              className={`h-full rounded-full ${
                isValid
                  ? 'bg-green-500'
                  : charCount >= 15
                  ? 'bg-yellow-500'
                  : 'bg-coral-500'
              }`}
            />
          </div>
          {isValid && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-green-500"
            >
              <Check className="h-4 w-4" />
              <span>Bio looks great!</span>
            </motion.div>
          )}
        </div>
      )}

      <p className="text-xs text-[var(--foreground-muted)] mt-3 sm:mt-4">
        This helps hosts create the perfect dining experience for you.
      </p>
    </motion.div>
  )
}
