'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

/**
 * Initialize PostHog analytics
 */
export function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

      if (posthogKey) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          // Enable session recording to ensure session IDs are tracked
          // Session IDs are automatically included in all events when enabled
          session_recording: {
            recordCrossOriginIframes: false,
          },
          // Ensure session IDs are captured on all events
          capture_pageview: true,
          capture_pageleave: true,
          // Automatically capture session IDs on all events
          autocapture: true,
          loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
              posthog.debug()
            }
            // Ensure session ID is initialized immediately after PostHog loads
            // This guarantees session tracking is active
            const sessionId = posthog.get_session_id()
            if (sessionId) {
              console.log('[PostHog] Session initialized:', sessionId)
            }
          },
        })
      }
    }
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}

/**
 * Track an event in PostHog
 * Automatically includes session ID to ensure all events are properly tracked
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog) {
    try {
      // Get session ID - PostHog automatically includes this when session recording is enabled,
      // but we explicitly ensure it's present to avoid the "No session ID" warning
      const sessionId = posthog.get_session_id()
      
      // Capture event with session ID explicitly included
      // PostHog will also automatically attach it, but being explicit ensures it's always there
      posthog.capture(eventName, {
        ...properties,
        // Explicitly include session ID to ensure all events have it
        ...(sessionId && { $session_id: sessionId }),
      })
    } catch (error) {
      console.error('[PostHog] Error tracking event:', error)
    }
  }
}

/**
 * Identify a user in PostHog
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog) {
    posthog.identify(userId, properties)
  }
}
