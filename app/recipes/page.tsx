'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Heart, MessageCircle, Utensils, Eye, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface RecipeListItem {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  servings: number | null
  prepTime: string | null
  cookTime: string | null
  tags: string[]
  createdAt: string
  author: {
    id: string
    name: string | null
    profileImageUrl: string | null
  }
  stats?: {
    views: number
    uses: number
    experience: number
  }
  _count: {
    likes: number
    comments: number
  }
  likedByCurrentUser: boolean
}

export default function RecipesPage() {
  const { data: session } = useSession()
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recipes')
      .then((res) => res.json())
      .then((data) => {
        setRecipes(data.recipes || [])
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load recipes:', error)
        setLoading(false)
      })
  }, [])

  const toggleLike = async (recipeId: string) => {
    if (!session?.user) return
    try {
      const response = await fetch(`/api/recipes/${recipeId}/like`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to like recipe')
      }
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === recipeId
            ? {
                ...recipe,
                likedByCurrentUser: data.liked,
                _count: {
                  ...recipe._count,
                  likes: recipe._count.likes + (data.liked ? 1 : -1),
                },
              }
            : recipe
        )
      )
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Recipes</h1>
            <p className="text-[var(--foreground-secondary)] mt-2">
              Discover community recipes crafted with Dine Bot.
            </p>
          </div>
          {session?.user && (
            <Button href="/minebot/plan-recipe" size="lg">
              Create a recipe
            </Button>
          )}
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6 text-[var(--foreground-muted)]">Loading recipes...</CardContent>
          </Card>
        ) : recipes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-[var(--foreground-muted)]">
              No recipes yet. Be the first to share one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="border-[var(--border)]">
                <CardContent className="p-6 space-y-4">
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
                    <div className="rounded-lg overflow-hidden border border-[var(--border)] aspect-video mb-3">
                      <img
                        src={getProxiedImageUrl(recipe.imageUrl) ?? recipe.imageUrl}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">{recipe.title}</h2>
                    {recipe.description && (
                      <p className="text-sm text-[var(--foreground-secondary)] mt-1 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-[var(--foreground-muted)]">
                    {recipe.servings && (
                      <span className="px-2 py-1 rounded-full bg-[var(--background-secondary)]">
                        Serves {recipe.servings}
                      </span>
                    )}
                    {recipe.prepTime && (
                      <span className="px-2 py-1 rounded-full bg-[var(--background-secondary)]">
                        Prep {recipe.prepTime}
                      </span>
                    )}
                    {recipe.cookTime && (
                      <span className="px-2 py-1 rounded-full bg-[var(--background-secondary)]">
                        Cook {recipe.cookTime}
                      </span>
                    )}
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

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-sm text-[var(--foreground-muted)]">
                      <button
                        className={cn(
                          'flex items-center gap-1',
                          recipe.likedByCurrentUser ? 'text-pink-500' : ''
                        )}
                        onClick={() => toggleLike(recipe.id)}
                        disabled={!session?.user}
                      >
                        <Heart className={cn('w-4 h-4', recipe.likedByCurrentUser ? 'fill-current' : '')} />
                        {recipe._count.likes}
                      </button>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {recipe._count.comments}
                      </div>
                      {recipe.stats && (
                        <>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {recipe.stats.views}
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="w-4 h-4" />
                            {recipe.stats.uses}
                          </div>
                        </>
                      )}
                    </div>
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1"
                    >
                      View recipe
                      <Utensils className="w-4 h-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
