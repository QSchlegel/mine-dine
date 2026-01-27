'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SwipeRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/swipe')
  }, [router])

  // Show a brief loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-foreground-secondary">Redirecting...</p>
      </div>
    </div>
  )
}
