'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Euro, TrendingUp } from 'lucide-react'
import type { PricingBreakdown } from '@/lib/ai/dinner-planner'

interface PricingSuggestionsProps {
  pricing: PricingBreakdown
  guestCount: number
}

export default function PricingSuggestions({ pricing, guestCount }: PricingSuggestionsProps) {
  const totalRevenue = pricing.suggestedPricePerPerson * guestCount
  const profit = totalRevenue - pricing.totalCost
  const profitMargin = pricing.totalCost > 0 ? (profit / pricing.totalCost) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="w-5 h-5 text-primary-500" />
          Pricing Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-secondary">Ingredient Cost</span>
            <span className="font-medium text-foreground">€{pricing.ingredients.toFixed(2)}</span>
          </div>
          {pricing.labor && (
            <div className="flex justify-between text-sm">
              <span className="text-foreground-secondary">Labor Estimate</span>
              <span className="font-medium text-foreground">€{pricing.labor.toFixed(2)}</span>
            </div>
          )}
          {pricing.overhead && (
            <div className="flex justify-between text-sm">
              <span className="text-foreground-secondary">Overhead</span>
              <span className="font-medium text-foreground">€{pricing.overhead.toFixed(2)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between">
              <span className="font-medium text-foreground">Total Cost</span>
              <span className="font-semibold text-foreground">€{pricing.totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Suggested Price per Person</span>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              €{pricing.suggestedPricePerPerson.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-foreground-secondary">
            For {guestCount} guests: €{totalRevenue.toFixed(2)} total
          </div>
        </div>

        {profit > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <div className="text-sm font-medium text-green-900 dark:text-green-100">
                Estimated Profit: €{profit.toFixed(2)}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                {profitMargin.toFixed(1)}% margin
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
