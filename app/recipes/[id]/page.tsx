'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Avatar } from '@/components/ui/Avatar'
import { Heart, MessageCircle, Eye, Flame, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecipeDetail {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  servings: number | null
  prepTime: string | null
  cookTime: string | null
  ingredients: Array<{ name: string; quantity: string; unit?: string; notes?: string }>
  steps: Array<{ step: string; duration?: string }>
  tags: string[]
  createdAt: string
  author: {
    id: string
    name: string | null
    profileImageUrl: string | null
  }
  viewCount?: number
  useCount?: number
  experience?: number
  comments: Array<{
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string | null
      profileImageUrl: string | null
    }
  }>
  _count: {
    likes: number
    comments: number
  }
  likedByCurrentUser: boolean
}

export default function RecipeDetailPage() {
  const params = useParams()
  const recipeId = params?.id as string
  const { data: session } = useSession()
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecordingView, setIsRecordingView] = useState(false)

  useEffect(() => {
    if (!recipeId) return
    setLoading(true)
    fetch(`/api/recipes/${recipeId}`)
      .then((res) => res.json())
      .then((data) => {
        setRecipe(data.recipe)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load recipe:', error)
        setLoading(false)
      })
  }, [recipeId])

  useEffect(() => {
    if (!recipeId) return
    setIsRecordingView(true)
    fetch(`/api/recipes/${recipeId}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'view' }),
    }).finally(() => setIsRecordingView(false))
  }, [recipeId])

  const toggleLike = async () => {
    if (!session?.user || !recipe) return
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/like`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to like recipe')
      }
      setRecipe((prev) =>
        prev
          ? {
              ...prev,
              likedByCurrentUser: data.liked,
              _count: {
                ...prev._count,
                likes: prev._count.likes + (data.liked ? 1 : -1),
              },
            }
          : prev
      )
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const submitComment = async () => {
    if (!comment.trim() || !recipe) return
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add comment')
      }
      setRecipe((prev) =>
        prev
          ? {
              ...prev,
              comments: [data.comment, ...prev.comments],
              _count: {
                ...prev._count,
                comments: prev._count.comments + 1,
              },
            }
          : prev
      )
      setComment('')
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const recordUse = async () => {
    if (!recipeId || isRecordingView) return
    await fetch(`/api/recipes/${recipeId}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'use' }),
    })
    setRecipe((prev) =>
      prev
        ? {
            ...prev,
            useCount: (prev.useCount || 0) + 1,
            experience: (prev.experience || 0) + 2,
          }
        : prev
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--foreground-muted)]">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--foreground-muted)]">Recipe not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Avatar
                src={recipe.author.profileImageUrl || undefined}
                name={recipe.author.name || 'User'}
                size="sm"
              />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {recipe.author.name || 'Anonymous'}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {new Date(recipe.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {recipe.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-[var(--border)] aspect-video max-w-2xl mb-4">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-[var(--foreground-secondary)] mt-2">{recipe.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-[var(--foreground-muted)]">
              {recipe.servings && <span>Servings: {recipe.servings}</span>}
              {recipe.prepTime && <span>Prep: {recipe.prepTime}</span>}
              {recipe.cookTime && <span>Cook: {recipe.cookTime}</span>}
            </div>

            {recipe.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full text-xs bg-pink-500/10 text-pink-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
              <button
                className={cn(
                  'flex items-center gap-1',
                  recipe.likedByCurrentUser ? 'text-pink-500' : ''
                )}
                onClick={toggleLike}
                disabled={!session?.user}
              >
                <Heart className={cn('w-4 h-4', recipe.likedByCurrentUser ? 'fill-current' : '')} />
                {recipe._count.likes} likes
              </button>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {recipe._count.comments} comments
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {recipe.viewCount ?? 0}
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4" />
                {recipe.useCount ?? 0}
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                {recipe.experience ?? 0} XP
              </div>
              <Button size="sm" variant="outline" onClick={recordUse}>
                Mark used in dinner
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Ingredients</h2>
                <ul className="space-y-2 text-sm text-[var(--foreground-secondary)]">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index}>
                      {ingredient.quantity} {ingredient.unit ? ingredient.unit : ''} {ingredient.name}
                      {ingredient.notes ? ` (${ingredient.notes})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Steps</h2>
                <ol className="space-y-2 text-sm text-[var(--foreground-secondary)] list-decimal list-inside">
                  {recipe.steps.map((step, index) => (
                    <li key={index}>
                      {step.step}
                      {step.duration ? ` (${step.duration})` : ''}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Comments</h2>
              {!session?.user && (
                <Button href="/login" variant="outline" size="sm">
                  Sign in to comment
                </Button>
              )}
            </div>
            {session?.user && (
              <div className="space-y-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share a tip or variation..."
                  rows={3}
                />
                <Button
                  onClick={submitComment}
                  disabled={!comment.trim() || isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? 'Posting...' : 'Post comment'}
                </Button>
              </div>
            )}

            {recipe.comments.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {recipe.comments.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <Avatar
                      src={item.user.profileImageUrl || undefined}
                      name={item.user.name || 'User'}
                      size="xs"
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {item.user.name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
