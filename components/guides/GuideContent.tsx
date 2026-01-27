'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/Card'

interface GuideContentProps {
  title: string
  children: ReactNode
  icon?: ReactNode
}

export function GuideContent({ title, children, icon }: GuideContentProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <div className="text-foreground-secondary">{children}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
