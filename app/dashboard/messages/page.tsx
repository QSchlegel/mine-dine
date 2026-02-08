'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { format, isToday, isYesterday } from 'date-fns'
import Image from 'next/image'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { useSession } from '@/lib/auth-client'
import { MessageCircle, Send } from 'lucide-react'

interface Message {
  id: string
  content: string
  createdAt: string
  readAt: string | null
  sender: {
    id: string
    name: string | null
    profileImageUrl: string | null
  }
  recipient: {
    id: string
    name: string | null
    profileImageUrl: string | null
  }
}

interface ConversationItem {
  id: string
  content: string
  createdAt: string
  sender: { id: string; name: string | null; profileImageUrl: string | null }
  recipient: { id: string; name: string | null; profileImageUrl: string | null }
}

function formatConversationTime(date: string) {
  const d = new Date(date)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

function formatMessageDate(date: string) {
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, MMMM d')
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()
  const currentUserId = (session as any)?.user?.id || null

  const selectedOther = selectedUserId
    ? conversations.find((c) => (c.sender.id === currentUserId ? c.recipient.id : c.sender.id) === selectedUserId)
    : null
  const selectedOtherUser = selectedOther
    ? selectedOther.sender.id === currentUserId
      ? selectedOther.recipient
      : selectedOther.sender
    : null

  useEffect(() => {
    fetch('/api/messages')
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.conversations || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching conversations:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (selectedUserId) {
      fetch(`/api/messages?userId=${selectedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          setMessages(data.messages || [])
        })
        .catch((err) => {
          console.error('Error fetching messages:', err)
        })
    } else {
      setMessages([])
    }
  }, [selectedUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: selectedUserId,
          content: newMessage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setNewMessage('')
      setMessages([...messages, data.message])
    } catch (err) {
      console.error('Error sending message:', err)
      alert(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <LoadingScreen title="Loading messages" subtitle="Fetching your conversations" />
  }

  // Group messages by date for separators
  const messagesByDate = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const key = format(new Date(msg.createdAt), 'yyyy-MM-dd')
    if (!acc[key]) acc[key] = []
    acc[key].push(msg)
    return acc
  }, {})
  const dateKeys = Object.keys(messagesByDate).sort()

  return (
    <div className="min-h-screen bg-[var(--background)]/80 backdrop-blur-sm py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-6 sm:mb-8">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Conversation list */}
          <div className="lg:col-span-1 min-h-0">
            <Card className="h-[320px] lg:h-[560px] flex flex-col">
              <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                {conversations.length === 0 ? (
                  <div className="flex flex-col flex-1 items-center justify-center gap-3 p-6 text-center text-[var(--foreground-muted)]">
                    <MessageCircle className="h-10 w-10 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs">Messages from bookings will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)] overflow-y-auto flex-1">
                    {conversations.map((conv) => {
                      const otherUser = conv.sender.id === currentUserId ? conv.recipient : conv.sender
                      const isSelected = selectedUserId === otherUser.id

                      return (
                        <button
                          key={currentUserId === conv.sender.id ? `c-${conv.recipient.id}` : `c-${conv.sender.id}`}
                          onClick={() => setSelectedUserId(otherUser.id)}
                          className={`w-full p-3 sm:p-4 text-left transition-colors hover:bg-[var(--background-secondary)] ${
                            isSelected ? 'bg-[var(--background-elevated)]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`relative h-11 w-11 rounded-full overflow-hidden bg-[var(--background-tertiary)] flex-shrink-0 ring-2 ring-offset-2 ring-offset-[var(--background)] ${
                                isSelected ? 'ring-[var(--primary)]' : 'ring-transparent'
                              }`}
                            >
                              {otherUser.profileImageUrl ? (
                                <Image
                                  src={getProxiedImageUrl(otherUser.profileImageUrl) ?? otherUser.profileImageUrl}
                                  alt={otherUser.name || 'User'}
                                  fill
                                  className="object-cover"
                                  sizes="44px"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground-muted)] text-sm font-medium">
                                  {(otherUser.name || '?').slice(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-[var(--foreground)]">
                                {otherUser.name || 'Anonymous'}
                              </p>
                              <p className="text-sm text-[var(--foreground-muted)] truncate">{conv.content}</p>
                            </div>
                            <span className="text-xs text-[var(--foreground-muted)] flex-shrink-0">
                              {formatConversationTime(conv.createdAt)}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Thread */}
          <div className="lg:col-span-2 min-h-[400px] lg:min-h-[560px]">
            {selectedUserId && selectedOtherUser ? (
              <Card className="h-[500px] lg:h-[560px] flex flex-col overflow-hidden">
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--background)]/95 shrink-0">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-[var(--background-tertiary)] flex-shrink-0">
                    {selectedOtherUser.profileImageUrl ? (
                      <Image
                        src={
                          getProxiedImageUrl(selectedOtherUser.profileImageUrl) ??
                          selectedOtherUser.profileImageUrl
                        }
                        alt={selectedOtherUser.name || 'User'}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground-muted)] text-sm font-medium">
                        {(selectedOtherUser.name || '?').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--foreground)] truncate">
                      {selectedOtherUser.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">Conversation</p>
                  </div>
                </div>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-1 flex flex-col">
                  {dateKeys.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[var(--foreground-muted)] py-8">
                      <MessageCircle className="h-12 w-12 opacity-40" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    <>
                      {dateKeys.map((dateKey) => (
                        <div key={dateKey} className="space-y-2">
                          <div className="flex justify-center">
                            <span className="text-xs text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-3 py-1 rounded-full">
                              {formatMessageDate(messagesByDate[dateKey][0].createdAt)}
                            </span>
                          </div>
                          {messagesByDate[dateKey].map((message) => {
                            const isFromThem = message.sender.id === selectedUserId

                            return (
                              <div
                                key={message.id}
                                className={`flex ${isFromThem ? 'justify-start' : 'justify-end'}`}
                              >
                                <div
                                  className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${
                                    isFromThem ? '' : 'flex-row-reverse'
                                  }`}
                                >
                                  <div className="relative h-8 w-8 rounded-full overflow-hidden bg-[var(--background-tertiary)] flex-shrink-0">
                                    {message.sender.profileImageUrl ? (
                                      <Image
                                        src={
                                          getProxiedImageUrl(message.sender.profileImageUrl) ??
                                          message.sender.profileImageUrl
                                        }
                                        alt={message.sender.name || 'User'}
                                        fill
                                        className="object-cover"
                                        sizes="32px"
                                      />
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground-muted)] text-xs font-medium">
                                        {(message.sender.name || '?').slice(0, 1).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                                      isFromThem
                                        ? 'rounded-bl-md bg-[var(--background-elevated)] text-[var(--foreground)] border border-[var(--border)]'
                                        : 'rounded-br-md bg-[var(--primary)] text-white'
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                    <p
                                      className={`text-[10px] mt-1 ${
                                        isFromThem ? 'text-[var(--foreground-muted)]' : 'text-white/75'
                                      }`}
                                    >
                                      {format(new Date(message.createdAt), 'HH:mm')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </CardContent>

                {/* Input */}
                <div className="border-t border-[var(--border)] p-3 sm:p-4 bg-[var(--background)] shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      rows={2}
                      className="flex-1 min-h-[44px] resize-none"
                    />
                    <Button
                      type="submit"
                      isLoading={sending}
                      disabled={!newMessage.trim()}
                      size="sm"
                      className="shrink-0 h-11 px-4"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Send</span>
                    </Button>
                  </form>
                </div>
              </Card>
            ) : (
              <Card className="h-[500px] lg:h-[560px] flex flex-col">
                <CardContent className="flex-1 flex flex-col items-center justify-center gap-4 py-12 text-center text-[var(--foreground-muted)]">
                  <MessageCircle className="h-14 w-14 opacity-40" />
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Select a conversation</p>
                    <p className="text-sm mt-1">Choose a thread from the list to view and send messages</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
