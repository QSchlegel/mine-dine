'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { format } from 'date-fns'
import Image from 'next/image'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { useSession } from '@/lib/auth-client'

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

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { data: session } = useSession()
  const currentUserId = (session as any)?.user?.id || null

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
    }
  }, [selectedUserId])

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

  return (
    <div className="min-h-screen bg-[var(--background)]/80 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-[var(--foreground-muted)]">
                      No conversations yet
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const otherUser = conv.sender.id === currentUserId ? conv.recipient : conv.sender

                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedUserId(otherUser.id)}
                          className={`w-full p-4 text-left hover:bg-[var(--background-secondary)] ${
                            selectedUserId === otherUser.id ? 'bg-[var(--background-elevated)]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-[var(--background-tertiary)]">
                              {otherUser.profileImageUrl ? (
                                <Image
                                  src={getProxiedImageUrl(otherUser.profileImageUrl) ?? otherUser.profileImageUrl}
                                  alt={otherUser.name || 'User'}
                                  fill
                                  className="object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{otherUser.name || 'Anonymous'}</p>
                              <p className="text-sm text-[var(--foreground-muted)] truncate">{conv.content}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedUserId ? (
              <Card className="h-[600px] flex flex-col">
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender.id === selectedUserId ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div className={`flex items-end gap-2 ${message.sender.id === selectedUserId ? '' : 'flex-row-reverse'}`}>
                        <div className="relative h-8 w-8 rounded-full overflow-hidden bg-[var(--background-tertiary)] flex-shrink-0">
                          {message.sender.profileImageUrl ? (
                            <Image
                              src={getProxiedImageUrl(message.sender.profileImageUrl) ?? message.sender.profileImageUrl}
                              alt={message.sender.name || 'User'}
                              fill
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender.id === selectedUserId
                              ? 'bg-[var(--background-elevated)] text-[var(--foreground)]'
                              : 'bg-[var(--primary)] text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender.id === selectedUserId
                                ? 'text-[var(--foreground-muted)]'
                                : 'text-white/80'
                            }`}
                          >
                            {format(new Date(message.createdAt), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardContent className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button type="submit" isLoading={sending} disabled={!newMessage.trim()}>
                      Send
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-[var(--foreground-muted)]">
                  Select a conversation to start messaging
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
