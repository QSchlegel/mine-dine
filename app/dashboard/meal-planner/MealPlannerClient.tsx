'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { useSession } from '@/lib/auth-client'
import type { MealPlannerInitialData } from '@/lib/server/meal-planner-data'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Sparkles,
  UtensilsCrossed,
  BookOpen,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'

const STORAGE_KEY = 'mindine_meal_plan_v1'

type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner'

type PlannedMeal = {
  id: string
  date: string // YYYY-MM-DD
  meal: MealSlot
  title: string
  source?: 'custom' | 'booking' | 'dinner' | 'recipe'
  sourceId?: string
  notes?: string
  link?: string
  guests?: number
  location?: string
}

type BookingEntry = {
  id: string
  status: string
  numberOfGuests: number
  dinner: {
    id: string
    title: string
    dateTime: string
    location: string
    host: {
      name: string | null
    }
  }
}

type HostDinner = {
  id: string
  title: string
  dateTime: string
  status: string
  location: string
}

type RecipeQuickPick = {
  id: string
  title: string
  prepTime?: string | null
  cookTime?: string | null
  servings?: number | null
}

type MealDraft = {
  id?: string
  date: string
  meal: MealSlot
  title: string
  source?: PlannedMeal['source']
  sourceId?: string
  notes?: string
  link?: string
  guests?: number
  location?: string
}

const mealColors: Record<MealSlot, string> = {
  Breakfast: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200/70 dark:border-amber-500/40',
  Lunch: 'bg-accent-50 dark:bg-accent-500/10 border-accent-200/70 dark:border-accent-500/40',
  Dinner: 'bg-coral-50 dark:bg-coral-500/10 border-coral-200/70 dark:border-coral-500/40',
}

function toDateKey(value: string | Date) {
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, 'yyyy-MM-dd')
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

interface MealPlannerClientProps {
  initialData: MealPlannerInitialData | null
}

export default function MealPlannerClient({ initialData }: MealPlannerClientProps) {
  const { data: session, isPending } = useSession()
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [draft, setDraft] = useState<MealDraft | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [bookings, setBookings] = useState<BookingEntry[]>(initialData?.bookings ?? [])
  const [hostDinners, setHostDinners] = useState<HostDinner[]>(initialData?.hostDinners ?? [])
  const [recipes, setRecipes] = useState<RecipeQuickPick[]>(initialData?.recipes ?? [])
  const [loadingData, setLoadingData] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const hasServerData = !!initialData

  const isHost = useMemo(() => {
    if (initialData) {
      return initialData.isHost
    }

    const role = (session?.user as any)?.role
    return role === 'HOST' || role === 'ADMIN'
  }, [initialData, session?.user])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PlannedMeal[]
        setPlannedMeals(parsed)
      } catch (err) {
        console.warn('Failed to parse stored meal plan', err)
      }
    }
    setHydrated(true)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plannedMeals))
    } catch (err) {
      console.warn('Failed to save meal plan', err)
    }
  }, [plannedMeals, hydrated])

  // Fetch bookings/dinners/recipes when session available
  useEffect(() => {
    if (initialData || !session?.user) {
      setLoadingData(false)
      return
    }

    const load = async () => {
      setLoadingData(true)
      setError(null)
      try {
        const [bookingsRes, dinnersRes, recipesRes] = await Promise.allSettled([
          fetch('/api/bookings').then((res) => res.ok ? res.json() : Promise.reject(res.statusText)),
          isHost
            ? fetch('/api/dinners?status=all').then((res) => res.ok ? res.json() : Promise.reject(res.statusText))
            : Promise.resolve({ dinners: [] }),
          fetch('/api/recipes').then((res) => res.ok ? res.json() : Promise.reject(res.statusText)),
        ])

        if (bookingsRes.status === 'fulfilled') {
          const upcoming = (bookingsRes.value.bookings || []).filter((b: BookingEntry) =>
            isAfter(new Date(b.dinner.dateTime), new Date())
          )
          setBookings(upcoming)
        }

        if (dinnersRes.status === 'fulfilled') {
          const mine = (dinnersRes.value.dinners || []).filter(
            (d: any) => d.host?.id === (session.user as any)?.id && isAfter(new Date(d.dateTime), new Date())
          )
          const cleaned: HostDinner[] = mine.map((d: any) => ({
            id: d.id,
            title: d.title,
            dateTime: d.dateTime,
            status: d.status,
            location: d.location,
          }))
          setHostDinners(cleaned)
        }

        if (recipesRes.status === 'fulfilled') {
          const picks: RecipeQuickPick[] = (recipesRes.value.recipes || []).slice(0, 6).map((r: any) => ({
            id: r.id,
            title: r.title,
            prepTime: r.prepTime,
            cookTime: r.cookTime,
            servings: r.servings,
          }))
          setRecipes(picks)
        }
      } catch (err) {
        console.error('Meal planner data failed', err)
        setError('Unable to load your data right now. You can still plan manually.')
      } finally {
        setLoadingData(false)
      }
    }

    load()
  }, [initialData, session?.user, isHost])

  const weekStart = useMemo(() =>
    startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 }),
  [weekOffset])

  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const mealsByDay = useMemo(() => {
    const map: Record<string, PlannedMeal[]> = {}
    for (const meal of plannedMeals) {
      const key = meal.date
      if (!map[key]) map[key] = []
      map[key].push(meal)
    }
    // Sort meals within a day by meal slot order
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => mealOrder(a.meal) - mealOrder(b.meal))
    }
    return map
  }, [plannedMeals])

  const plannedThisWeek = plannedMeals.filter((m) =>
    !isBefore(parseISO(m.date), weekStart) && !isAfter(parseISO(m.date), addDays(weekStart, 6))
  )

  const openDraft = (date: Date, seed?: Partial<MealDraft>) => {
    const dateKey = toDateKey(date)
    setDraft({
      date: dateKey,
      meal: seed?.meal || 'Dinner',
      title: seed?.title || '',
      source: seed?.source,
      sourceId: seed?.sourceId,
      notes: seed?.notes,
      link: seed?.link,
      guests: seed?.guests,
      location: seed?.location,
    })
    setWeekOffset(Math.floor(differenceInCalendarDays(startOfDay(date), startOfWeek(new Date(), { weekStartsOn: 1 })) / 7))
  }

  const saveDraft = () => {
    if (!draft || !draft.title.trim()) return
    const entry: PlannedMeal = {
      id: draft.id || createId(),
      date: draft.date,
      meal: draft.meal,
      title: draft.title.trim(),
      source: draft.source,
      sourceId: draft.sourceId,
      notes: draft.notes?.trim() || undefined,
      link: draft.link?.trim() || undefined,
      guests: draft.guests,
      location: draft.location,
    }

    setPlannedMeals((prev) => {
      const withoutDuplicateSource = prev.filter((m) =>
        !(entry.source && entry.sourceId && m.source === entry.source && m.sourceId === entry.sourceId)
      )
      return [...withoutDuplicateSource, entry].sort((a, b) => a.date.localeCompare(b.date))
    })
    setDraft(null)
  }

  const removeMeal = (id: string) => {
    setPlannedMeals((prev) => prev.filter((m) => m.id !== id))
  }

  const quickAddBooking = (booking: BookingEntry) => {
    openDraft(parseISO(booking.dinner.dateTime), {
      title: booking.dinner.title,
      meal: 'Dinner',
      source: 'booking',
      sourceId: booking.id,
      notes: `${booking.numberOfGuests} guests · Host: ${booking.dinner.host.name || 'Unknown'}`,
      location: booking.dinner.location,
    })
  }

  const quickAddHostDinner = (dinner: HostDinner) => {
    openDraft(parseISO(dinner.dateTime), {
      title: dinner.title,
      meal: 'Dinner',
      source: 'dinner',
      sourceId: dinner.id,
      location: dinner.location,
    })
  }

  const quickAddRecipe = (recipe: RecipeQuickPick) => {
    openDraft(new Date(), {
      title: recipe.title,
      meal: 'Dinner',
      source: 'recipe',
      sourceId: recipe.id,
      notes: [recipe.prepTime, recipe.cookTime].filter(Boolean).join(' · ') || undefined,
    })
  }

  if (isPending && !hasServerData) {
    return <LoadingScreen title="Loading" subtitle="Preparing your planner" />
  }

  if (!session?.user && !hasServerData) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral-50 text-coral-600 border border-coral-100">
            <CalendarIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">Meal Calendar</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Plan your meals</h1>
          <p className="text-[var(--foreground-secondary)]">Sign in to sync bookings, dinners, and recipes into a weekly calendar.</p>
          <div className="flex justify-center gap-3 mt-4">
            <Button href="/login">Log in</Button>
            <Button href="/signup" variant="secondary">Create account</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-coral-50 via-amber-50 to-accent-50 text-sm text-[var(--foreground-secondary)] border border-[var(--border)]">
              <Sparkles className="w-4 h-4 text-coral-500" />
              <span>New · Meal calendar</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Plan the coming meals</h1>
            <p className="text-[var(--foreground-secondary)]">
              Pull in your booked dinners, host events, and favorite recipes, then lay them out on a week-by-week calendar.
            </p>
            {error && (
              <div className="text-sm text-warning-600 bg-warning-50 border border-warning-100 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-[var(--foreground-muted)]">
              <Badge variant="outline">{plannedThisWeek.length} meals this week</Badge>
              <Badge variant="outline">{plannedMeals.length} saved in total</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" leftIcon={<CalendarIcon className="w-4 h-4" />} onClick={() => setWeekOffset(0)}>
              This week
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => openDraft(new Date())}>
              Add meal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.75fr_1fr] gap-6">
          <Card className="border-[var(--border)] shadow-refined-lg">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-coral-500" />
                {weekLabel}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-3">
                {days.map((day) => {
                  const key = toDateKey(day)
                  const items = mealsByDay[key] || []
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div
                      key={key}
                      className={cn(
                        'rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/70 backdrop-blur-sm p-3 flex flex-col gap-3 shadow-refined',
                        isToday && 'border-coral-400/70 shadow-glow-coral'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">{format(day, 'EEE')}</p>
                          <p className="text-lg font-semibold text-[var(--foreground)]">{format(day, 'MMM d')}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => openDraft(day)}>
                          <Plus className="w-4 h-4" />
                          Add
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {items.length === 0 && (
                          <div className="text-xs text-[var(--foreground-muted)] bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2">
                            No plan yet. Add a meal.
                          </div>
                        )}

                        {items.map((meal) => (
                          <div
                            key={meal.id}
                            className={cn(
                              'rounded-xl border px-3 py-2 shadow-sm relative overflow-hidden',
                              mealColors[meal.meal]
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <Badge variant={meal.meal === 'Dinner' ? 'coral' : meal.meal === 'Lunch' ? 'blue' : 'warning'} size="sm" glow>
                                  {meal.meal}
                                </Badge>
                                <p className="font-semibold text-[var(--foreground)] leading-tight">{meal.title}</p>
                                {meal.location && (
                                  <p className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                                    <MapPin className="w-3 h-3" />
                                    {meal.location}
                                  </p>
                                )}
                                {meal.notes && (
                                  <p className="text-xs text-[var(--foreground-secondary)] line-clamp-2">{meal.notes}</p>
                                )}
                                {meal.link && (
                                  <Link
                                    href={meal.link}
                                    className="text-xs text-coral-600 dark:text-neon-coral hover:underline"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Open link
                                  </Link>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMeal(meal.id)}
                                className="text-[var(--foreground-muted)] hover:text-danger-500 transition"
                                aria-label="Remove meal"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {meal.source && (
                              <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wide text-[var(--foreground-muted)]">
                                {meal.source === 'booking' && <Clock className="w-3 h-3" />}<span>{labelForSource(meal.source)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-coral-500" />
                  Smart pulls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingData && (
                  <p className="text-sm text-[var(--foreground-muted)]">Syncing your bookings and dinners…</p>
                )}
                {!loadingData && bookings.length === 0 && hostDinners.length === 0 && (
                  <p className="text-sm text-[var(--foreground-muted)]">No upcoming bookings yet. Browse dinners or create one to pull them here.</p>
                )}

                {bookings.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                      <CalendarIcon className="w-4 h-4 text-coral-500" />
                      Your upcoming bookings
                    </div>
                    <div className="space-y-3">
                      {bookings.slice(0, 3).map((booking) => (
                        <div key={booking.id} className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-[var(--foreground)]">{booking.dinner.title}</p>
                              <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(booking.dinner.dateTime), 'EEE, MMM d · p')}
                              </p>
                              <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {booking.dinner.location}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => quickAddBooking(booking)}>
                              Plan
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isHost && hostDinners.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                      <ChefHat className="w-4 h-4 text-accent-600" />
                      Dinners you host
                    </div>
                    <div className="space-y-3">
                      {hostDinners.slice(0, 3).map((dinner) => (
                        <div key={dinner.id} className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-[var(--foreground)]">{dinner.title}</p>
                              <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(dinner.dateTime), 'EEE, MMM d · p')}
                              </p>
                              <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {dinner.location}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => quickAddHostDinner(dinner)}>
                              Plan
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recipes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      Favorite recipes
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recipes.map((recipe) => (
                        <div key={recipe.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 flex flex-col gap-2">
                          <p className="text-sm font-semibold text-[var(--foreground)] line-clamp-2">{recipe.title}</p>
                          <p className="text-xs text-[var(--foreground-muted)]">{[recipe.prepTime, recipe.cookTime].filter(Boolean).join(' · ') || 'Flexible timing'}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-wide text-[var(--foreground-muted)]">{recipe.servings ? `${recipe.servings} servings` : 'Servings TBD'}</span>
                            <Button size="sm" variant="ghost" onClick={() => quickAddRecipe(recipe)}>
                              Place
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {draft && (
              <Card className="border-coral-200/70 shadow-glow-coral-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-coral-500" />
                    Plan a meal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--foreground)]">Date</label>
                      <Input
                        type="date"
                        value={draft.date}
                        onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--foreground)]">Meal</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Breakfast', 'Lunch', 'Dinner'] as MealSlot[]).map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setDraft({ ...draft, meal: slot })}
                            className={cn(
                              'rounded-xl border px-3 py-2 text-sm font-semibold transition',
                              draft.meal === slot
                                ? 'border-coral-400 bg-coral-50 text-coral-700'
                                : 'border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
                            )}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--foreground)]">Dish or experience</label>
                    <Input
                      placeholder="e.g. Sicilian seafood night"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--foreground)]">Notes</label>
                    <Textarea
                      rows={3}
                      placeholder="Add ingredients to prep, timing, or guests"
                      value={draft.notes || ''}
                      onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--foreground)]">Link (optional)</label>
                      <Input
                        placeholder="Recipe or dinner URL"
                        value={draft.link || ''}
                        onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--foreground)]">Guests (optional)</label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="2"
                        value={draft.guests ?? ''}
                        onChange={(e) => setDraft({ ...draft, guests: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={() => setDraft(null)}>
                      Cancel
                    </Button>
                    <Button onClick={saveDraft} disabled={!draft.title.trim()}>
                      Save to calendar
                    </Button>
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

function mealOrder(slot: MealSlot) {
  if (slot === 'Breakfast') return 0
  if (slot === 'Lunch') return 1
  return 2
}

function labelForSource(source: PlannedMeal['source']) {
  switch (source) {
    case 'booking':
      return 'Booking'
    case 'dinner':
      return 'Host dinner'
    case 'recipe':
      return 'Recipe'
    default:
      return 'Custom'
  }
}
