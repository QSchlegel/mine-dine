'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ShoppingCart, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Ingredient } from '@/lib/ai/dinner-planner'

interface IngredientListProps {
  ingredients: Ingredient[]
  onExport?: () => void
}

export default function IngredientList({ ingredients, onExport }: IngredientListProps) {
  const ingredientsByCategory = ingredients.reduce((acc, ingredient) => {
    const category = ingredient.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(ingredient)
    return acc
  }, {} as Record<string, Ingredient[]>)

  const handleExport = () => {
    const text = ingredients
      .map((ing) => `${ing.name} - ${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''}`)
      .join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shopping-list.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    if (onExport) {
      onExport()
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary-500" />
          Shopping List
        </CardTitle>
        {onExport && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(ingredientsByCategory).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                {category}
              </h3>
              <ul className="space-y-1">
                {items.map((ingredient, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-2 rounded hover:bg-background-secondary transition-colors"
                  >
                    <span className="text-foreground">{ingredient.name}</span>
                    <span className="text-sm font-medium text-foreground-secondary">
                      {ingredient.quantity}
                      {ingredient.unit && ` ${ingredient.unit}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
