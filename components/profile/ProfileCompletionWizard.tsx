'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { getProfileCompletionProgress, type ProfileCompletionResult } from '@/lib/profile'
import { slideInFromRight, slideInFromLeft, fadeInUp } from '@/lib/animations'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

type Direction = 'forward' | 'backward'
import NameStep from './steps/NameStep'
import BioStep from './steps/BioStep'
import TagsStep from './steps/TagsStep'

interface ProfileCompletionWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  initialData?: {
    name?: string | null
    bio?: string | null
    selectedTags?: string[]
  }
}

type Step = 1 | 2 | 3

export default function ProfileCompletionWizard({
  isOpen,
  onClose,
  onComplete,
  initialData,
}: ProfileCompletionWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [name, setName] = useState(initialData?.name || '')
  const [bio, setBio] = useState(initialData?.bio || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    // Ensure no duplicates in initial data
    const initial = initialData?.selectedTags || []
    return [...new Set(initial)]
  })
  const [saving, setSaving] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [completion, setCompletion] = useState<ProfileCompletionResult | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [direction, setDirection] = useState<Direction>('forward')
  const [error, setError] = useState<string | null>(null)
  
  // Store callbacks in ref to avoid dependency issues in useEffect
  const callbacksRef = useRef({ onComplete, onClose })
  useEffect(() => {
    callbacksRef.current = { onComplete, onClose }
  }, [onComplete, onClose])

  // Update completion progress when form data changes
  useEffect(() => {
    const currentProfile = {
      name,
      bio,
      userTags: selectedTags.map(tagId => ({ tag: { id: tagId } })),
    }
    const completionData = getProfileCompletionProgress(currentProfile)
    setCompletion(completionData)
    setIsComplete(completionData.isComplete)
  }, [name, bio, selectedTags])

  // Track unsaved changes
  useEffect(() => {
    if (name || bio || selectedTags.length > 0) {
      setHasUnsavedChanges(true)
    }
  }, [name, bio, selectedTags])

  // Reset wizard when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '')
      setBio(initialData?.bio || '')
      // Ensure no duplicates when setting initial tags
      const initialTags = initialData?.selectedTags || []
      setSelectedTags([...new Set(initialTags)])
      setCurrentStep(1)
      setIsComplete(false)
      setHasUnsavedChanges(false)
      setDirection('forward')
      setError(null)
    }
  }, [isOpen, initialData])

  const handleClose = () => {
    if (hasUnsavedChanges && !isComplete) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        return name.trim().length >= 2
      case 2:
        return bio.trim().length >= 20
      case 3:
        return selectedTags.length >= 3
      default:
        return false
    }
  }

  const saveStep = async (step: Step): Promise<boolean> => {
    setSaving(true)
    setError(null)
    try {
      if (step === 1 || step === 2) {
        // Save name and bio
        const response = await fetch('/api/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, bio }),
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to save profile')
        }
      }

      if (step === 3) {
        // Save tags - ensure we have tags to save
        if (selectedTags.length === 0) {
          throw new Error('Please select at least 3 tags')
        }
        
        // Remove any duplicate tag IDs
        const uniqueTagIds = [...new Set(selectedTags)]
        if (uniqueTagIds.length !== selectedTags.length) {
          console.warn('Duplicate tags detected, removing duplicates')
        }
        
        const response = await fetch('/api/profiles/tags', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagIds: uniqueTagIds }),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to save tags')
        }
        
        // Verify the save was successful
        const result = await response.json()
        if (!result.profile) {
          throw new Error('Tags were not saved properly')
        }
        
        // Verify tag count matches (allowing for some tolerance in case of duplicates)
        const savedTagCount = result.profile.userTags?.length || 0
        if (savedTagCount < uniqueTagIds.length) {
          console.warn(`Tag count mismatch. Expected: ${uniqueTagIds.length}, Got: ${savedTagCount}`)
        }
      }

      setHasUnsavedChanges(false)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save'
      console.error('Error saving step:', error)
      setError(errorMessage)
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    if (!validateStep(currentStep)) return

    const saved = await saveStep(currentStep)
    if (saved && currentStep < 3) {
      setDirection('forward')
      setCurrentStep((prev) => (prev + 1) as Step)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection('backward')
      setCurrentStep((prev) => (prev - 1) as Step)
    }
  }

  const handleComplete = async () => {
    if (!isComplete) return

    setSaving(true)
    setError(null)
    
    try {
      // Remove any duplicate tag IDs before saving
      const uniqueTagIds = [...new Set(selectedTags)]
      if (uniqueTagIds.length !== selectedTags.length) {
        console.warn('Duplicate tags detected, removing duplicates before save')
        setSelectedTags(uniqueTagIds)
      }
      
      // Save all data: name, bio, and tags
      const [profileResponse, tagsResponse] = await Promise.all([
        fetch('/api/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, bio }),
        }),
        fetch('/api/profiles/tags', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagIds: uniqueTagIds }),
        }),
      ])

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save profile')
      }

      if (!tagsResponse.ok) {
        const errorData = await tagsResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save tags')
      }

      // Verify tags were saved
      const tagsResult = await tagsResponse.json()
      const savedTagCount = tagsResult.profile?.userTags?.length || 0
      const savedTagIds = tagsResult.profile?.userTags?.map((ut: any) => ut.tag.id) || []
      
      if (!tagsResult.profile) {
        throw new Error('Failed to verify tags were saved')
      }
      
      // Verify all tags were saved
      const missingTags = uniqueTagIds.filter(id => !savedTagIds.includes(id))
      if (missingTags.length > 0) {
        console.error('Some tags were not saved:', missingTags)
        throw new Error(`Failed to save ${missingTags.length} tag(s)`)
      }
      
      if (savedTagCount !== uniqueTagIds.length) {
        console.warn('Tag count mismatch. Expected:', uniqueTagIds.length, 'Got:', savedTagCount)
      } else {
        console.log('All tags saved successfully:', savedTagCount, 'tags')
      }

      setHasUnsavedChanges(false)
      setIsComplete(true)
      setError(null)
      // Note: Don't set saving to false here - let the success screen show
      // The modal will close automatically
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile'
      console.error('Error completing profile:', error)
      setError(errorMessage)
      setSaving(false)
    }
  }

  // Auto-close when profile is complete
  useEffect(() => {
    if (isComplete && isOpen) {
      const timer = setTimeout(() => {
        callbacksRef.current.onComplete()
        callbacksRef.current.onClose()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isComplete, isOpen])

  const stepTitles = {
    1: 'Your Name',
    2: 'Your Bio',
    3: 'Your Interests',
  }

  const stepDescriptions = {
    1: 'This helps hosts personalize your experience',
    2: 'Tell hosts about your food preferences and interests',
    3: 'Select tags to help us match you with perfect hosts',
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <NameStep
            name={name}
            onChange={setName}
            isValid={validateStep(1)}
          />
        )
      case 2:
        return (
          <BioStep
            bio={bio}
            onChange={setBio}
            isValid={validateStep(2)}
          />
        )
      case 3:
        return (
          <TagsStep
            selectedTags={selectedTags}
            onChange={setSelectedTags}
            isValid={validateStep(3)}
          />
        )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      showCloseButton={!isComplete}
      closeOnBackdropClick={!hasUnsavedChanges || isComplete}
    >
      {isComplete ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-6"
          >
            <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-white" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Complete!</h2>
          <p className="text-gray-600 mb-6">You're all set. We're matching you with amazing hosts.</p>
          <p className="text-sm text-gray-500 mb-4">Closing automatically...</p>
          <Button
            onClick={() => {
              onComplete()
              onClose()
            }}
            variant="outline"
            size="sm"
          >
            Close Now
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Progress Header */}
          <div className="mb-6">
            {/* Step Dots */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: currentStep === step ? 1.2 : 1,
                      backgroundColor:
                        currentStep > step
                          ? '#10b981'
                          : currentStep === step
                          ? '#6366f1'
                          : '#e5e7eb',
                    }}
                    className="h-3 w-3 rounded-full transition-colors"
                  />
                  {step < 3 && (
                    <div
                      className={`h-0.5 w-8 mx-1 ${
                        currentStep > step ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <motion.div
                initial={false}
                animate={{
                  width: completion ? `${completion.progress}%` : '0%',
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500"
              />
            </div>

            {/* Step Title and Description */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Step {currentStep}: {stepTitles[currentStep]}
              </h2>
              <p className="text-sm text-gray-600">{stepDescriptions[currentStep]}</p>
            </motion.div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-800">{error}</p>
            </motion.div>
          )}

          {/* Step Content */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                variants={direction === 'forward' ? slideInFromRight : slideInFromLeft}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || saving}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Back
            </Button>

            <div className="flex gap-3">
              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep) || saving}
                  isLoading={saving}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <Button
                    onClick={handleComplete}
                    disabled={!isComplete || saving}
                    isLoading={saving}
                    rightIcon={<Check className="h-4 w-4" />}
                  >
                    {selectedTags.length >= 3 && selectedTags.length < 5
                      ? 'Finish & Continue'
                      : 'Complete Profile'}
                  </Button>
                  {isComplete && selectedTags.length >= 3 && (
                    <p className="text-xs text-gray-500 text-right max-w-xs">
                      {selectedTags.length < 5
                        ? 'You can add more tags later in your profile settings'
                        : 'Feel free to add even more tags before finishing!'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
