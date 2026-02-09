'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useSessionState } from '@/components/auth/SessionStateProvider'
import { Bot } from 'lucide-react'

interface AssistantAction {
  id: string
  label: string
  href: string
  reason?: string
}

interface AssistantMessage {
  role: 'assistant' | 'user'
  content: string
  action?: AssistantAction | null
}

const FLOATING_ASSISTANT_PATH_PREFIXES = ['/dashboard', '/dinners', '/recipes', '/swipe']

export function ProactiveAssistant() {
  const pathname = usePathname()
  const { data: session, isPending } = useSessionState()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const assistantRef = useRef<HTMLDivElement | null>(null)
  const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/signup')
  const isMineBotStudioRoute = pathname?.startsWith('/minebot/plan-recipe') || pathname?.startsWith('/minebot/plan-dinner')
  const isKeyRoute = FLOATING_ASSISTANT_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix))

  const pushAssistantMessage = (content: string, action?: AssistantAction | null) => {
    setMessages((prev) => [...prev, { role: 'assistant', content, action: action ?? null }])
  }

  useEffect(() => {
    if (!isOpen || !assistantRef.current) return
    assistantRef.current.scrollTop = assistantRef.current.scrollHeight
  }, [isOpen, messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending) return
    setIsSending(true)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          path: pathname,
        }),
      })
      const data = await response.json()
      if (response.ok && data?.reply?.message) {
        pushAssistantMessage(data.reply.message, data.reply.action)
      } else {
        pushAssistantMessage('Tell me where you want to go, and I will suggest the fastest path.')
      }
    } catch (error) {
      console.error('Failed to fetch assistant reply:', error)
      pushAssistantMessage('Tell me where you want to go, and I will suggest the fastest path.')
    } finally {
      setIsSending(false)
    }
  }

  if (isAuthRoute || isMineBotStudioRoute || !isKeyRoute || isPending || !session?.user) {
    return null
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <Card
          className="w-[360px] sm:w-[440px] overflow-hidden border border-[var(--border-strong)]"
          hover="none"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--background-secondary)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/15 text-pink-500">
                  <Bot className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold text-[var(--foreground)]">Dine Bot</p>
              </div>
              <p className="text-xs text-[var(--foreground-muted)]">Navigation help</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              aria-label="Close assistant"
            >
              ✕
            </button>
          </div>

          <div ref={assistantRef} className="max-h-[420px] overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">
                Ask where to go next: messages, dinners, recipes, or host tools.
              </p>
            ) : (
              messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className="space-y-2">
                  <div
                    className={cn(
                      'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                      message.role === 'assistant'
                        ? 'bg-[var(--background-elevated)] text-[var(--foreground)]'
                        : 'bg-[var(--primary)] text-white ml-auto'
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === 'assistant' && message.action && (
                    <div className="max-w-[92%] rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                        Suggested action
                      </p>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {message.action.label}
                      </p>
                      {message.action.reason && (
                        <p className="text-xs text-[var(--foreground-muted)] mt-1">
                          {message.action.reason}
                        </p>
                      )}
                      <Button
                        href={message.action.href}
                        variant="secondary"
                        size="sm"
                        className="mt-2 w-full"
                      >
                        {message.action.label}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--background)]">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                placeholder="Ask where to go next..."
                className="flex-1 min-h-[90px]"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!input.trim() || isSending}
                onClick={handleSend}
              >
                Send
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={() => setIsOpen((prev) => !prev)}
        className="shadow-lg px-6"
      >
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-4 w-4" />
          </span>
          {isOpen ? 'Hide Dine Bot' : 'Dine Bot'}
        </span>
      </Button>
    </div>
  )
}
