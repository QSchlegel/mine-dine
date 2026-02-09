'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const GlobalBackground = dynamic(() => import('@/components/GlobalBackground'), { ssr: false })
const ScrollToTop = dynamic(
  () => import('@/components/ui/ScrollToTop').then((mod) => mod.ScrollToTop),
  { ssr: false }
)
const ProactiveAssistant = dynamic(
  () => import('@/components/assistant/ProactiveAssistant').then((mod) => mod.ProactiveAssistant),
  { ssr: false }
)

export function DeferredChrome() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let idleId: number | null = null

    const mountDeferred = () => setIsReady(true)

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(mountDeferred, { timeout: 1200 })
    } else {
      timeoutId = setTimeout(mountDeferred, 450)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (idleId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }
    }
  }, [])

  if (!isReady) {
    return null
  }

  return (
    <>
      <GlobalBackground />
      <ScrollToTop />
      <ProactiveAssistant />
    </>
  )
}
