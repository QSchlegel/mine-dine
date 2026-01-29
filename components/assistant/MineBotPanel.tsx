'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

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

interface MineBotPanelProps {
  mode?: 'plan_dinner' | 'plan_recipe' | 'moderator' | 'general'
  title?: string
  subtitle?: string
  initialMessage?: string
  inputId?: string
}

export function MineBotPanel({
  mode = 'general',
  title = 'Dine Bot',
  subtitle = 'Collaborate on your plan',
  initialMessage,
  inputId = 'minebot-input',
}: MineBotPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>(() =>
    initialMessage
      ? [{ role: 'assistant', content: initialMessage, action: null }]
      : []
  )
  const pathname = usePathname()
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const pushAssistantMessage = (content: string, action?: AssistantAction | null) => {
    setMessages((prev) => [...prev, { role: 'assistant', content, action: action ?? null }])
  }

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
          mode,
          path: pathname,
        }),
      })
      const data = await response.json()
      if (response.ok && data?.reply?.message) {
        pushAssistantMessage(data.reply.message, data.reply.action)
      } else {
        pushAssistantMessage('I can help you shape the plan. What should we refine?')
      }
    } catch (error) {
      console.error('Failed to fetch Dine Bot reply:', error)
      pushAssistantMessage('I can help you shape the plan. What should we refine?')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="h-full border border-[var(--border-strong)]" hover="none">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
          <p className="text-xs text-[var(--foreground-muted)]">{subtitle}</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-[420px] max-h-[520px] overflow-y-auto px-5 py-4 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--foreground-muted)]">
            Tell me what you want to build and I’ll help shape it.
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

      <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--background)]">
        <div className="flex gap-2 items-end">
          <Textarea
            id={inputId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder="Ask Dine Bot to refine, rename, or improve..."
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
  )
}
