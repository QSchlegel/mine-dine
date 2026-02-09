'use client'

import { useReportWebVitals } from 'next/web-vitals'

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void
    }
  }
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (typeof window === 'undefined' || !window.umami?.track) {
      return
    }

    window.umami.track('web-vital', {
      name: metric.name,
      value: Number(metric.value.toFixed(2)),
      rating: metric.rating,
      delta: Number(metric.delta.toFixed(2)),
      id: metric.id,
      navigationType: metric.navigationType,
    })
  })

  return null
}
