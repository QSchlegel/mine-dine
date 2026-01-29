'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import type { DinnerPlanningParams } from '@/lib/ai/dinner-planner'

interface PlanningStepsProps {
  onComplete: (params: DinnerPlanningParams) => void
  onCancel: () => void
  isLoading?: boolean
}

const presets: Array<{ label: string; description: string; params: Partial<DinnerPlanningParams> }> = [
  {
    label: 'Italian Date Night',
    description: '4 guests • pasta-forward • cozy',
    params: { cuisine: 'Italian', guestCount: 4, theme: 'Cozy date night', skillLevel: 'intermediate', budgetRange: { min: 45, max: 70 } },
  },
  {
    label: 'Vibrant Vegan Brunch',
    description: '8 guests • plant-based • colorful plates',
    params: { cuisine: 'Vegan', guestCount: 8, occasion: 'Sunday brunch', budgetRange: { min: 30, max: 55 }, skillLevel: 'beginner' },
  },
  {
    label: 'Tapas & Natural Wine',
    description: '12 guests • share plates • relaxed',
    params: { cuisine: 'Spanish Tapas', guestCount: 12, theme: 'Natural wine & small plates', budgetRange: { min: 50, max: 80 } },
  },
]

export default function PlanningSteps({
  onComplete,
  onCancel,
  isLoading = false,
}: PlanningStepsProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [params, setParams] = useState<Partial<DinnerPlanningParams>>({
    guestCount: 8,
    skillLevel: 'intermediate',
  })

  const totalSteps = 5

  const updateParam = <K extends keyof DinnerPlanningParams>(
    key: K,
    value: DinnerPlanningParams[K]
  ) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const applyPreset = (presetParams: Partial<DinnerPlanningParams>) => {
    setParams((prev) => ({ ...prev, ...presetParams }))
    setCurrentStep(5)
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Validate and complete
      if (params.guestCount && params.guestCount > 0) {
        onComplete(params as DinnerPlanningParams)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return params.cuisine && params.cuisine.length > 0
      case 2:
        return params.guestCount && params.guestCount > 0
      case 3:
        return true // Optional step
      case 4:
        return true // Optional step
      case 5:
        return true // Review step
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground-secondary">Step {currentStep} of {totalSteps}</span>
          <span className="text-foreground-secondary">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-background-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            className="h-full bg-primary-500 rounded-full"
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && 'Cuisine & Theme'}
                {currentStep === 2 && 'Guest Count & Skill Level'}
                {currentStep === 3 && 'Dietary Restrictions'}
                {currentStep === 4 && 'Budget & Occasion'}
                {currentStep === 5 && 'Review & Generate'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: Cuisine & Theme */}
              {currentStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Cuisine Type *
                    </label>
                    <Input
                      value={params.cuisine || ''}
                      onChange={(e) => updateParam('cuisine', e.target.value)}
                      placeholder="e.g., Italian, Asian, Mediterranean, French"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Theme (Optional)
                    </label>
                    <Input
                      value={params.theme || ''}
                      onChange={(e) => updateParam('theme', e.target.value)}
                      placeholder="e.g., Rustic, Modern, Traditional, Fusion"
                    />
                  </div>

                  {/* Quick presets */}
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                      Quick starts
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {presets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyPreset(preset.params)}
                          className="text-left rounded-lg border border-border hover:border-primary-300 hover:shadow-sm transition-all p-3 bg-background-secondary"
                        >
                          <p className="text-sm font-semibold text-foreground">{preset.label}</p>
                          <p className="text-xs text-foreground-muted">{preset.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Guest Count & Skill */}
              {currentStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Number of Guests *
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={params.guestCount || 8}
                      onChange={(e) => updateParam('guestCount', parseInt(e.target.value) || 8)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Your Cooking Skill Level
                    </label>
                    <select
                      value={params.skillLevel || 'intermediate'}
                      onChange={(e) =>
                        updateParam('skillLevel', e.target.value as 'beginner' | 'intermediate' | 'advanced')
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </>
              )}

              {/* Step 3: Dietary Restrictions */}
              {currentStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Dietary Restrictions (Optional)
                    </label>
                    <Textarea
                      value={params.dietaryRestrictions?.join(', ') || ''}
                      onChange={(e) => {
                        const restrictions = e.target.value
                          .split(',')
                          .map((r) => r.trim())
                          .filter((r) => r.length > 0)
                        updateParam('dietaryRestrictions', restrictions)
                      }}
                      placeholder="e.g., Vegetarian, Vegan, Gluten-free, Dairy-free (comma-separated)"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Step 4: Budget & Occasion */}
              {currentStep === 4 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Min Price per Person (€)
                      </label>
                      <Input
                        type="number"
                        min={20}
                        value={params.budgetRange?.min || ''}
                        onChange={(e) =>
                          updateParam('budgetRange', {
                            ...params.budgetRange,
                            min: parseFloat(e.target.value) || undefined,
                          } as { min: number; max: number })
                        }
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Max Price per Person (€)
                      </label>
                      <Input
                        type="number"
                        min={20}
                        value={params.budgetRange?.max || ''}
                        onChange={(e) =>
                          updateParam('budgetRange', {
                            ...params.budgetRange,
                            max: parseFloat(e.target.value) || undefined,
                          } as { min: number; max: number })
                        }
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Occasion (Optional)
                    </label>
                    <Input
                      value={params.occasion || ''}
                      onChange={(e) => updateParam('occasion', e.target.value)}
                      placeholder="e.g., Birthday, Anniversary, Casual Gathering"
                    />
                  </div>
                </>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-3">
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-2">Summary</p>
                    <ul className="space-y-1 text-sm text-foreground-secondary">
                      <li>Cuisine: {params.cuisine || 'Not specified'}</li>
                      <li>Guests: {params.guestCount || 'Not specified'}</li>
                      <li>Skill Level: {params.skillLevel || 'Not specified'}</li>
                      {params.dietaryRestrictions && params.dietaryRestrictions.length > 0 && (
                        <li>Dietary: {params.dietaryRestrictions.join(', ')}</li>
                      )}
                      {params.budgetRange && (
                        <li>
                          Budget: €{params.budgetRange.min || '?'} - €{params.budgetRange.max || '?'} per person
                        </li>
                      )}
                    </ul>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    Ready to generate your dinner plan? Click &quot;Generate Plan&quot; to create a
                    comprehensive menu, shopping list, and prep timeline.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handleBack}
          disabled={isLoading}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed() || isLoading}
          isLoading={isLoading && currentStep === totalSteps}
        >
          {currentStep === totalSteps ? (
            <>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Plan'
              )}
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
