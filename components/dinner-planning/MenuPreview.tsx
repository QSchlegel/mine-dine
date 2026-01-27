'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Utensils } from 'lucide-react'
import type { MenuItem } from '@/lib/ai/dinner-planner'

interface MenuPreviewProps {
  menuItems: MenuItem[]
}

export default function MenuPreview({ menuItems }: MenuPreviewProps) {
  const itemsByCourse = menuItems.reduce((acc, item) => {
    if (!acc[item.course]) {
      acc[item.course] = []
    }
    acc[item.course].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-primary-500" />
          Menu Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(itemsByCourse).map(([course, items]) => (
            <div key={course}>
              <h3 className="text-lg font-semibold text-foreground mb-3">{course}</h3>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-background-secondary border border-border"
                  >
                    <h4 className="font-medium text-foreground mb-1">{item.name}</h4>
                    <p className="text-sm text-foreground-secondary mb-2">{item.description}</p>
                    {item.dietaryInfo && item.dietaryInfo.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.dietaryInfo.map((diet, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                          >
                            {diet}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
