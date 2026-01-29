'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Bot } from 'lucide-react'
import PlanningSteps from './PlanningSteps'
import MenuPreview from './MenuPreview'
import PricingSuggestions from './PricingSuggestions'
import IngredientList from './IngredientList'
import type { DinnerPlanningParams, DinnerPlan } from '@/lib/ai/dinner-planner'

interface AIPlannerProps {
  onPlanGenerated: (plan: DinnerPlan) => void
  onCancel: () => void
}

export default function AIPlanner({ onPlanGenerated, onCancel }: AIPlannerProps) {
  const [step, setStep] = useState<'planning' | 'generating' | 'review'>('planning')
  const [plan, setPlan] = useState<DinnerPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [assistantNote, setAssistantNote] = useState<string | null>(null)
  const [isConsulting, setIsConsulting] = useState(false)

  const handlePlanningComplete = async (params: DinnerPlanningParams) => {
    setStep('generating')
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/dinners/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate plan')
      }

      const data = await response.json()
      setPlan(data.plan)
      setStep('review')
    } catch (err) {
      console.error('Error generating plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate plan')
      setStep('planning')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setStep('planning')
    setPlan(null)
    setError(null)
  }

  const handleAccept = () => {
    if (plan) {
      onPlanGenerated(plan)
    }
  }

  const handleAskAssistant = async () => {
    if (!plan || isConsulting) return
    setIsConsulting(true)
    setAssistantNote(null)
    try {
      const summary = plan.menuItems
        .map((item) => `${item.course}: ${item.name}`)
        .slice(0, 5)
        .join('; ')
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `We drafted this dinner plan: ${summary}. Give 3 crisp improvement ideas (menu swaps, plating, pacing) and a punchy title.`,
          mode: 'plan_dinner',
          path: '/minebot/plan-dinner',
        }),
      })
      const data = await response.json()
      if (response.ok && data?.reply?.message) {
        setAssistantNote(data.reply.message)
      } else {
        setAssistantNote('Dine Bot could not respond right now. Try again in a moment.')
      }
    } catch (err) {
      console.error('Assistant suggestion failed:', err)
      setAssistantNote('Dine Bot could not respond right now. Try again in a moment.')
    } finally {
      setIsConsulting(false)
    }
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === 'planning' && (
          <motion.div
            key="planning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PlanningSteps
              onComplete={handlePlanningComplete}
              onCancel={onCancel}
              isLoading={isGenerating}
            />
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Generating Your Plan</h3>
            <p className="text-foreground-secondary">
              Our AI is creating a comprehensive dinner plan for you...
            </p>
          </motion.div>
        )}

        {step === 'review' && plan && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Dine Bot quick suggestions */}
            <Card className="border-[var(--border)] bg-[var(--background-secondary)]">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Dine Bot suggestions</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAskAssistant}
                      isLoading={isConsulting}
                      disabled={isConsulting}
                    >
                      {isConsulting ? 'Thinking...' : 'Ask for tweaks'}
                    </Button>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    Get 3 quick improvements and a title idea before you move on.
                  </p>
                  {assistantNote && (
                    <div className="rounded-lg bg-background p-3 text-sm text-foreground-secondary whitespace-pre-wrap">
                      {assistantNote}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Success Message */}
            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      Plan Generated Successfully!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Review the details below and make any adjustments before creating your dinner.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
              <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <MenuPreview menuItems={plan.menuItems} />
                <IngredientList ingredients={plan.ingredientList} />
              </div>
              <div className="space-y-6">
                <PricingSuggestions
                  pricing={plan.pricingBreakdown}
                  guestCount={plan.ingredientList.length > 0 ? 8 : 0}
                />
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Prep Timeline</h3>
                    <div className="space-y-3">
                      {plan.prepTimeline.map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex-shrink-0 w-24 text-sm font-medium text-foreground-secondary">
                            {step.time}
                          </div>
                          <div className="flex-1">
                            <p className="text-foreground">{step.task}</p>
                            {step.duration && (
                              <p className="text-sm text-foreground-muted">{step.duration}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleAccept}>
                  Use This Plan
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
