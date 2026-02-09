'use client'

import { createContext, useContext, useMemo } from 'react'
import { useSession } from '@/lib/auth-client'

interface SessionStateValue {
  data: ReturnType<typeof useSession>['data']
  isPending: boolean
}

const SessionStateContext = createContext<SessionStateValue | null>(null)

export function SessionStateProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession()

  const value = useMemo(
    () => ({
      data,
      isPending,
    }),
    [data, isPending]
  )

  return (
    <SessionStateContext.Provider value={value}>
      {children}
    </SessionStateContext.Provider>
  )
}

export function useSessionState() {
  const context = useContext(SessionStateContext)

  if (!context) {
    throw new Error('useSessionState must be used within a SessionStateProvider')
  }

  return context
}
