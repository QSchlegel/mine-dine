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
        <div className="text-gray-500">Loading tags...</div>
      </div>
    )
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Selection Counter */}
      <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div>
          <p className="text-sm font-medium text-indigo-900">
            {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
            {isValid && selectedTags.length >= 3 && (
              <span className="text-indigo-600"> (minimum met!)</span>
            )}
          </p>
          {!isValid ? (
            <p className="text-xs text-indigo-700 mt-1">
              {remaining} more tag{remaining !== 1 ? 's' : ''} needed to continue
            </p>
          ) : (
            <p className="text-xs text-indigo-700 mt-1">
              {selectedTags.length >= 8
                ? `Excellent! ${selectedTags.length} tags selected - keep adding more!`
                : selectedTags.length >= 5
                ? `Great! ${selectedTags.length} tags - add more for even better matching`
                : `Good start! Add more tags for better matching`}
            </p>
          )}
        </div>
        {isValid && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 text-green-600"
          >
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">
              {selectedTags.length >= 8 
                ? `Excellent! ${selectedTags.length} tags` 
                : selectedTags.length >= 5 
                ? `Great! ${selectedTags.length} tags`
                : 'Great selection!'}
            </span>
          </motion.div>
        )}
      </div>

      {/* Tags by Category */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-6 max-h-[450px] overflow-y-auto pr-2"
      >
        {Object.entries(tagsByCategory).map(([category, tags]) => (
          <motion.div key={category} variants={staggerItem}>
            <h3 className="font-medium text-gray-900 mb-3 capitalize text-sm">
              {category.toLowerCase().replace('_', ' ')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <motion.button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {tag.name}
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-2 inline-block"
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

      <div className="mt-4 space-y-2">
        <p className="text-xs text-gray-500">
          Select tags to help us match you with perfect hosts. Choose at least 3 tags (minimum required), but you can add as many tags as you like for better matching!
        </p>
        {isValid && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <p className="text-xs text-blue-900 font-medium mb-1">
                {selectedTags.length >= 8 
                  ? `Excellent! You've selected ${selectedTags.length} tags.`
                  : 'Add more tags for better matching!'}
              </p>
              <p className="text-xs text-blue-700">
                {selectedTags.length >= 8
                  ? 'The more tags you select, the better we can match you with hosts who share your interests. Feel free to add even more!'
                  : 'The more tags you select, the better we can match you with hosts who share your interests. You can add as many tags as you like!'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
