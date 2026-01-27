'use client'

import { motion } from 'framer-motion'
import { X, Search, BookOpen, MessageCircle, Lightbulb } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'

interface HelpOverlayProps {
  pageId: string
  onClose: () => void
}

// Help content for different pages
const helpContent: Record<string, { title: string; sections: Array<{ title: string; content: string }> }> = {
  swipe: {
    title: 'Discover Hosts',
    sections: [
      {
        title: 'How to Swipe',
        content: 'Swipe right to like a host, or swipe left to pass. You can also use the arrow keys on your keyboard or click the buttons below the card.',
      },
      {
        title: 'Matching',
        content: 'When both you and a host like each other, you\'ll get matched! You can then browse their dinners and book a spot.',
      },
      {
        title: 'Match Score',
        content: 'The match percentage shows how well your interests align with the host based on shared tags.',
      },
    ],
  },
  booking: {
    title: 'Booking a Dinner',
    sections: [
      {
        title: 'Select Guests',
        content: 'Choose how many guests will attend. Make sure not to exceed the maximum number of available spots.',
      },
      {
        title: 'Add-ons',
        content: 'Some dinners offer optional add-ons like wine pairings or special desserts. Select any you\'d like to include.',
      },
      {
        title: 'Payment',
        content: 'Payment is processed securely through Stripe. You can use credit cards, Apple Pay, or Google Pay.',
      },
    ],
  },
  'dinner-create': {
    title: 'Creating a Dinner',
    sections: [
      {
        title: 'Basic Information',
        content: 'Provide a compelling title and description. Include details about the cuisine, atmosphere, and what makes your dinner special.',
      },
      {
        title: 'AI Planning Mode',
        content: 'Use our AI planner to generate a complete menu, shopping list, and prep timeline. Just answer a few questions about your vision!',
      },
      {
        title: 'Pricing',
        content: 'Set a base price per person (recommended: €50). You can add optional add-ons for extras like wine or special courses.',
      },
      {
        title: 'Tags',
        content: 'Select tags that describe your dinner to help guests discover it. Include cuisine type, dietary options, and special features.',
      },
    ],
  },
  'host-dashboard': {
    title: 'Host Dashboard',
    sections: [
      {
        title: 'Application Status',
        content: 'Check your host application status here. Once approved, you can start creating dinners.',
      },
      {
        title: 'Manage Dinners',
        content: 'View all your dinner listings, edit them, or create new ones. You can save drafts before publishing.',
      },
      {
        title: 'Bookings',
        content: 'See all bookings for your dinners. Communicate with guests and manage your events.',
      },
    ],
  },
}

export default function HelpOverlay({ pageId, onClose }: HelpOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const content = helpContent[pageId] || {
    title: 'Help',
    sections: [
      {
        title: 'Welcome',
        content: 'This is the help center. Context-specific help will appear here based on the page you\'re viewing.',
      },
    ],
  }

  const filteredSections = content.sections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Modal isOpen={true} onClose={onClose} size="lg" title={content.title}>
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <Input
            type="text"
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Help Sections */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {filteredSections.length > 0 ? (
            filteredSections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg bg-background-secondary border border-border"
              >
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary-500" />
                  {section.title}
                </h3>
                <p className="text-sm text-foreground-secondary">{section.content}</p>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-foreground-secondary">
              <p>No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-foreground-muted text-center">
            Press <kbd className="px-2 py-1 bg-background-secondary rounded text-xs">?</kbd> to open help
          </p>
        </div>
      </div>
    </Modal>
  )
}
