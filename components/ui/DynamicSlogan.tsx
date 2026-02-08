'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SLOGANS = [
  { text: 'Mine dining not fine dining', emoji: '🍽️' },
  { text: 'Supperclub Bitch!', emoji: '🔥' },
  { text: 'No reservations, just vibes', emoji: '✨' },
  { text: 'Home-cooked chaos', emoji: '🍳' },
  { text: 'Eat real, not corporate', emoji: '💪' },
  { text: 'Kitchen rebels only', emoji: '⚡' },
  { text: 'Food that slaps', emoji: '👋' },
  { text: 'Underground dining revolution', emoji: '🌍' },
  { text: 'Real food, real people, zero BS', emoji: '🎯' },
  { text: 'Where chefs actually cook', emoji: '👨‍🍳' },
  { text: 'Ditch the ordinary, join the movement', emoji: '🚀' },
  { text: 'Authentic AF', emoji: '💯' },
]

interface DynamicSloganProps {
  interval?: number // milliseconds between slogan changes
  className?: string
}

export default function DynamicSlogan({ interval = 3500, className = '' }: DynamicSloganProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLOGANS.length)
    }, interval)

    return () => clearInterval(timer)
  }, [interval])

  const currentSlogan = SLOGANS[currentIndex]

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={currentIndex}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className={className}
      >
        {currentSlogan.emoji} {currentSlogan.text}
      </motion.span>
    </AnimatePresence>
  )
}
