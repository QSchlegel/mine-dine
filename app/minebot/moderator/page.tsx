'use client'

import { useMemo } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MineBotPanel } from '@/components/assistant/MineBotPanel'
import { Shield, AlertTriangle } from 'lucide-react'

export default function MineBotModeratorPage() {
  const { data: session, isPending } = useSession()
  const role = (session?.user as any)?.role
  const isModerator = role === 'MODERATOR' || role === 'ADMIN'

  const cannedPrompts = useMemo(
    () => [
      'Summarize the newest host applications and highlight risk factors.',
      'Draft a polite rejection note for an application that lacks enough detail.',
      'Give me 3 red-flag checks to run on a new dinner listing.',
    ],
    []
  )

  if (isPending) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Moderator Bot</h1>
          <p className="text-[var(--foreground-muted)] mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isModerator) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Moderator access required</h1>
          </div>
          <p className="text-[var(--foreground-muted)]">
            This Dine Bot mode is limited to moderators. If you believe this is a mistake, contact an admin.
          </p>
          <Button href="/dashboard" className="mt-6">
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Moderator Bot</h1>
            <p className="text-[var(--foreground-secondary)] mt-1">
              Get AI help triaging applications, drafting messages, and spotting risk signals.
            </p>
          </div>
        </div>

        <Card className="border-[var(--border)]">
          <CardContent className="p-6 space-y-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Suggested prompts</p>
            <div className="flex flex-wrap gap-2">
              {cannedPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const textarea = document.querySelector<HTMLTextAreaElement>('#minebot-mod-input')
                    if (textarea) {
                      textarea.value = prompt
                      textarea.dispatchEvent(new Event('input', { bubbles: true }))
                      textarea.focus()
                    }
                  }}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <MineBotPanel
          mode="moderator"
          title="Dine Bot · Moderator"
          subtitle="AI co-pilot for moderation tasks"
          initialMessage="How can I help? Paste an application, draft a response, or ask me to outline checks."
          inputId="minebot-mod-input"
        />
      </div>
    </div>
  )
}
