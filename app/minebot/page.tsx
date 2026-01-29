'use client'

import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChefHat, Utensils, Sparkles } from 'lucide-react'

export default function MineBotHubPage() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">MineBot</h1>
          <p className="text-[var(--foreground-muted)] mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">MineBot</h1>
          <p className="text-[var(--foreground-muted)] mt-3">
            Sign in to plan dinners and recipes with MineBot.
          </p>
          <Button href="/login" className="mt-6" size="lg">
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">MineBot</h1>
          <p className="text-[var(--foreground-secondary)] mt-2">
            Collaborate with MineBot to plan dinners and build shareable recipes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[var(--border)]">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/15 text-pink-500 flex items-center justify-center">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Plan a Dinner</h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                  Build a full dinner experience with menus, timelines, and pricing.
                </p>
              </div>
              <Button href="/minebot/plan-dinner" variant="primary" size="lg">
                Start dinner plan
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)]">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Plan a Recipe</h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                  Draft, refine, and publish recipes for the community.
                </p>
              </div>
              <Button href="/minebot/plan-recipe" variant="secondary" size="lg">
                Start recipe plan
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 text-[var(--primary)] flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Share your creations</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Publish recipes, get feedback, and build a following.
              <Link href="/recipes" className="ml-2 text-pink-500 hover:text-pink-600">
                Explore recipes
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
