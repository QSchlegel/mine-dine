import { useEffect, useRef } from 'react'

export interface HesitationDetails {
  idleSeconds: number
  lastActiveAt: number
}

interface HesitationOptions {
  idleMs?: number
  cooldownMs?: number
  onHesitation: (details: HesitationDetails) => void
}

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'wheel',
] as const

export function useHesitationMonitor({
  idleMs = 30000,
  cooldownMs = 10 * 60 * 1000,
  onHesitation,
}: HesitationOptions) {
  const lastActiveAtRef = useRef<number>(Date.now())
  const lastPromptAtRef = useRef<number>(0)
  const onHesitationRef = useRef(onHesitation)

  useEffect(() => {
    onHesitationRef.current = onHesitation
  }, [onHesitation])

  useEffect(() => {
    const recordActivity = () => {
      lastActiveAtRef.current = Date.now()
    }

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, recordActivity))
    document.addEventListener('visibilitychange', recordActivity)

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return
      }

      const now = Date.now()
      const idleDuration = now - lastActiveAtRef.current
      if (idleDuration < idleMs) {
        return
      }

      if (now - lastPromptAtRef.current < cooldownMs) {
        return
      }

      lastPromptAtRef.current = now
      onHesitationRef.current({
        idleSeconds: Math.floor(idleDuration / 1000),
        lastActiveAt: lastActiveAtRef.current,
      })
    }, 1000)

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, recordActivity))
      document.removeEventListener('visibilitychange', recordActivity)
      window.clearInterval(interval)
    }
  }, [idleMs, cooldownMs])
}
