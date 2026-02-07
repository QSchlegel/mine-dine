'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

interface Tag {
  id: string
  name: string
  category: string
}

interface TagsStepProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  isValid: boolean
}

export default function TagsStep({ selectedTags, onChange, isValid }: TagsStepProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => {
        setAllTags(data.tags || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching tags:', err)
        setLoading(false)
      })
  }, [])

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      // Remove tag
      onChange(selectedTags.filter((id) => id !== tagId))
    } else {
      // Add tag (ensure no duplicates)
      const updated = [...selectedTags, tagId]
      onChange([...new Set(updated)])
    }
  }

  const tagsByCategory = allTags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {} as Record<string, Tag[]>)

  const remaining = Math.max(0, 3 - selectedTags.length)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[var(--foreground-muted)]">Loading tags...</div>
      </div>
    )
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="space-y-4 sm:space-y-6"
    >
      {/* Selection Counter */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-coral-500/10 rounded-lg border border-coral-500/20">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
            {isValid && selectedTags.length >= 3 && (
              <span className="text-coral-500"> (minimum met!)</span>
            )}
          </p>
          {!isValid ? (
            <p className="text-xs text-[var(--foreground-secondary)] mt-0.5 sm:mt-1">
              {remaining} more tag{remaining !== 1 ? 's' : ''} needed to continue
            </p>
          ) : (
            <p className="text-xs text-[var(--foreground-secondary)] mt-0.5 sm:mt-1">
              {selectedTags.length >= 8
                ? `Excellent! Keep adding more!`
                : selectedTags.length >= 5
                ? `Great! Add more for better matching`
                : `Good start! Add more tags`}
            </p>
          )}
        </div>
        {isValid && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 sm:gap-2 text-green-500 shrink-0 ml-2"
          >
            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">
              {selectedTags.length >= 8
                ? `Excellent!`
                : selectedTags.length >= 5
                ? `Great!`
                : 'Good!'}
            </span>
          </motion.div>
        )}
      </div>

      {/* Tags by Category */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-4 sm:space-y-6 max-h-[280px] sm:max-h-[450px] overflow-y-auto pr-1 sm:pr-2 -mr-1 sm:-mr-2"
      >
        {Object.entries(tagsByCategory).map(([category, tags]) => (
          <motion.div key={category} variants={staggerItem}>
            <h3 className="font-medium text-[var(--foreground)] mb-2 sm:mb-3 capitalize text-xs sm:text-sm">
              {category.toLowerCase().replace('_', ' ')}
            </h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <motion.button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 sm:px-4 py-2 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 touch-manipulation min-h-[36px] sm:min-h-[40px] ${
                      isSelected
                        ? 'bg-gradient-to-r from-coral-500 to-coral-400 text-white shadow-md'
                        : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-[var(--background-tertiary)] border border-[var(--border)] active:bg-[var(--background-tertiary)]'
                    }`}
                  >
                    {tag.name}
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-1.5 sm:ml-2 inline-block"
                      >
                        <Check className="h-3 w-3 inline" />
                      </motion.span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-3 sm:mt-4 space-y-2">
        <p className="text-xs text-[var(--foreground-muted)]">
          Choose at least 3 tags. More tags = better host matching!
        </p>
        {isValid && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-2.5 sm:p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg"
          >
            <span className="text-cyan-500 text-base sm:text-lg shrink-0">💡</span>
            <div className="min-w-0">
              <p className="text-xs text-[var(--foreground)] font-medium mb-0.5 sm:mb-1">
                {selectedTags.length >= 8
                  ? `Excellent! ${selectedTags.length} tags selected.`
                  : 'Add more tags for better matching!'}
              </p>
              <p className="text-xs text-[var(--foreground-secondary)] hidden sm:block">
                {selectedTags.length >= 8
                  ? 'Feel free to add even more!'
                  : 'The more tags, the better your matches.'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
