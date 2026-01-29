'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import AIPlanner from '@/components/dinner-planning/AIPlanner'
import { MineBotPanel } from '@/components/assistant/MineBotPanel'
import type { DinnerPlan } from '@/lib/ai/dinner-planner'

export default function MineBotPlanDinnerPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loadingRole, setLoadingRole] = useState(true)
  const [latestPlan, setLatestPlan] = useState<DinnerPlan | null>(null)

  useEffect(() => {
    if (isPending) {
      setLoadingRole(true)
      return
    }

    if (!session?.user) {
      setUserRole(null)
      setLoadingRole(false)
      return
    }

    const roleFromSession = (session.user as any)?.role
    if (roleFromSession) {
      setUserRole(roleFromSession)
      setLoadingRole(false)
      return
    }

    fetch('/api/profiles')
      .then((res) => res.json())
      .then((data) => {
        setUserRole(data.profile?.role || null)
        setLoadingRole(false)
      })
      .catch(() => setLoadingRole(false))
  }, [session, isPending])

  if (isPending || loadingRole) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Plan a Dinner</h1>
          <p className="text-[var(--foreground-muted)] mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Plan a Dinner</h1>
          <p className="text-[var(--foreground-muted)] mt-3">
            Sign in to build a MineBot-assisted dinner plan.
          </p>
          <Button href="/login" className="mt-6" size="lg">
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  const isHost = userRole === 'HOST' || userRole === 'ADMIN'

  if (!isHost) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Plan a Dinner</h1>
          <p className="text-[var(--foreground-muted)]">
            Dinner planning is available to hosts. Apply to become a host to unlock this mode.
          </p>
          <Button href="/dashboard/host/apply" size="lg">
            Apply to host
          </Button>
        </div>
      </div>
    )
  }

  const handlePlanGenerated = (plan: DinnerPlan) => {
    setLatestPlan(plan)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mindine_pending_dinner_plan', JSON.stringify(plan))
    }
  }

  const handleContinue = () => {
    router.push('/dashboard/host/dinners/new')
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Plan a Dinner</h1>
          <p className="text-[var(--foreground-secondary)] mt-2">
            Work with MineBot to craft a full dinner experience, then carry it into your listing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="space-y-6">
            <AIPlanner
              onPlanGenerated={handlePlanGenerated}
              onCancel={() => router.push('/minebot')}
            />

            {latestPlan && (
              <Card className="border-[var(--border)]">
                <CardContent className="p-5 flex flex-col gap-3">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Plan saved. Continue to your dinner listing to keep building.
                  </p>
                  <Button onClick={handleContinue} size="lg">
                    Continue to listing
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <MineBotPanel
            mode="plan_dinner"
            title="MineBot Dinner Studio"
            subtitle="Refine your menu, timing, and pricing"
            initialMessage="Tell me the vibe you want and I’ll help shape your dinner plan."
          />
        </div>
      </div>
    </div>
  )
}
