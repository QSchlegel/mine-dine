'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  isWithinInterval,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalendarMode = 'single' | 'range'

export type CalendarRange = {
  start: Date | null
  end: Date | null
}

export type CalendarMarker = {
  date: Date
  color?: string
  label?: string
}

export interface CalendarProps {
  /** Selection mode, defaults to single-date selection */
  mode?: CalendarMode
  /** Controlled value for single mode */
  value?: Date | null
  /** Controlled value for range mode */
  range?: CalendarRange
  /** Fired when a date is picked in single mode */
  onChange?: (date: Date | null) => void
  /** Fired when a range is picked in range mode */
  onRangeChange?: (range: CalendarRange) => void
  /** Initially visible month */
  initialMonth?: Date
  /** Force the visible month (controlled) */
  month?: Date
  onMonthChange?: (month: Date) => void
  /** ISO week start (0 = Sunday, 1 = Monday, …) */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  minDate?: Date
  maxDate?: Date
  disabledDate?: (date: Date) => boolean
  markers?: CalendarMarker[]
  showHeader?: boolean
  showTodayButton?: boolean
  className?: string
}

/**
 * Lightweight calendar grid used across dashboards and booking flows.
 * Supports single-date or date-range selection, keyboard focus states,
 * and optional day markers (e.g., events or reservations).
 */
export const Calendar: React.FC<CalendarProps> = ({
  mode = 'single',
  value: controlledValue = null,
  range: controlledRange,
  onChange,
  onRangeChange,
  initialMonth,
  month: forcedMonth,
  onMonthChange,
  weekStartsOn = 1,
  minDate,
  maxDate,
  disabledDate,
  markers = [],
  showHeader = true,
  showTodayButton = true,
  className,
}) => {
  const [internalValue, setInternalValue] = useState<Date | null>(controlledValue)
  const [internalRange, setInternalRange] = useState<CalendarRange>({ start: null, end: null })
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  const selectedDate = controlledValue ?? internalValue
  const selectedRange = controlledRange ?? internalRange

  // Determine which month to display
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(
      forcedMonth ||
      initialMonth ||
      selectedDate ||
      selectedRange.start ||
      new Date()
    )
  )

  useEffect(() => {
    if (forcedMonth) {
      setCurrentMonth(startOfMonth(forcedMonth))
    }
  }, [forcedMonth])

  // Keep visible month aligned with newly selected dates
  useEffect(() => {
    if (forcedMonth) return

    const anchor = mode === 'single' ? selectedDate : selectedRange.start
    if (anchor) {
      setCurrentMonth((prev) => (isSameMonth(prev, anchor) ? prev : startOfMonth(anchor)))
    }
  }, [forcedMonth, mode, selectedDate, selectedRange.start])

  const markerMap = useMemo(() => {
    const map = new Map<string, CalendarMarker[]>()
    markers.forEach((marker) => {
      const key = format(marker.date, 'yyyy-MM-dd')
      const existing = map.get(key) ?? []
      map.set(key, [...existing, marker])
    })
    return map
  }, [markers])

  const changeMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      const next = addMonths(prev, delta)
      onMonthChange?.(next)
      return next
    })
  }

  const setDate = (date: Date | null) => {
    onChange?.(date)
    if (!onChange) {
      setInternalValue(date)
    }
  }

  const setRange = (range: CalendarRange) => {
    onRangeChange?.(range)
    if (!onRangeChange) {
      setInternalRange(range)
    }
  }

  const handleDayClick = (date: Date) => {
    if (isDateDisabled(date)) return

    if (mode === 'single') {
      setDate(date)
      return
    }

    // Range selection
    const { start, end } = selectedRange
    if (!start || (start && end)) {
      setRange({ start: date, end: null })
    } else {
      if (isBefore(date, start)) {
        setRange({ start: date, end: start })
      } else {
        setRange({ start, end: date })
      }
    }
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true
    if (maxDate && isAfter(date, endOfDay(maxDate))) return true
    if (disabledDate?.(date)) return true
    return false
  }

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn })
    return eachDayOfInterval({ start, end })
  }, [currentMonth, weekStartsOn])

  const weekdayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn })
    return Array.from({ length: 7 }).map((_, i) =>
      format(addDays(base, i), 'EEE')
    )
  }, [weekStartsOn])

  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-[var(--border)]',
        'bg-[var(--background-elevated)] shadow-refined',
        'text-[var(--foreground)]',
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-coral-500">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                {format(currentMonth, 'EEEE, MMM')}
              </p>
              <p className="text-lg font-semibold">{format(currentMonth, 'yyyy')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showTodayButton && (
              <button
                onClick={() => {
                  const today = new Date()
                  setCurrentMonth(startOfMonth(today))
                  onMonthChange?.(startOfMonth(today))
                }}
                className={cn(
                  'hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
                  'bg-[var(--background-secondary)] text-[var(--foreground)]',
                  'border border-[var(--border)] shadow-sm',
                  'hover:border-coral-400/70 hover:text-coral-500 hover:shadow-glow-coral',
                  'transition-colors duration-200'
                )}
              >
                Today
              </button>
            )}

            <NavButton
              ariaLabel="Previous month"
              onClick={() => changeMonth(-1)}
              icon={<ChevronLeft className="h-4 w-4" />}
            />
            <NavButton
              ariaLabel="Next month"
              onClick={() => changeMonth(1)}
              icon={<ChevronRight className="h-4 w-4" />}
            />
          </div>
        </div>
      )}

      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--foreground-muted)] pb-2">
          {weekdayLabels.map((label) => (
            <div key={label} className="text-center">{label}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const inCurrentMonth = isSameMonth(day, currentMonth)
            const disabled = isDateDisabled(day)
            const isSelected = mode === 'single' && selectedDate && isSameDay(day, selectedDate)
            const isRangeStart = mode === 'range' && selectedRange.start && isSameDay(day, selectedRange.start)
            const isRangeEnd = mode === 'range' && selectedRange.end && isSameDay(day, selectedRange.end)

            const rangeActive =
              mode === 'range' &&
              selectedRange.start &&
              selectedRange.end &&
              isWithinInterval(day, { start: selectedRange.start, end: selectedRange.end })

            const previewActive =
              mode === 'range' &&
              selectedRange.start &&
              !selectedRange.end &&
              hoverDate &&
              isWithinInterval(day, normalizeRange(selectedRange.start, hoverDate))

            const isHighlighted = rangeActive || previewActive

            const badgeMarkers = markerMap.get(key) ?? []

            return (
              <div
                key={key}
                className={cn(
                  'relative rounded-xl p-0.5 transition-colors',
                  isHighlighted && 'bg-coral-500/10',
                  (isRangeStart || isRangeEnd) && 'bg-coral-500/15',
                )}
              >
                <button
                  type="button"
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoverDate(day)}
                  onMouseLeave={() => setHoverDate(null)}
                  disabled={disabled}
                  className={cn(
                    'flex h-12 w-full items-center justify-center rounded-lg text-sm font-semibold',
                    'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-500',
                    !inCurrentMonth && 'text-[var(--foreground-muted)] opacity-50',
                    disabled && 'cursor-not-allowed opacity-40',
                    isSelected && 'bg-gradient-to-r from-coral-500 to-coral-600 text-white shadow-glow-coral',
                    (isRangeStart || isRangeEnd) &&
                      'bg-gradient-to-r from-coral-500 to-coral-500 text-white shadow-glow-coral',
                    !isSelected && !isRangeStart && !isRangeEnd && !disabled &&
                      'hover:bg-[var(--background-secondary)] hover:border hover:border-coral-400/40',
                    isToday(day) && !isSelected && !isRangeStart && !isRangeEnd &&
                      'border border-coral-400/60 text-coral-600 dark:text-coral-300'
                  )}
                >
                  <span>{format(day, 'd')}</span>
                </button>

                {badgeMarkers.length > 0 && (
                  <div className="absolute inset-x-2 bottom-1 flex items-center justify-center gap-1">
                    {badgeMarkers.slice(0, 3).map((marker, idx) => (
                      <span
                        key={`${key}-${idx}`}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          marker.color ?? 'bg-coral-500',
                          !marker.color && 'bg-coral-500'
                        )}
                        title={marker.label}
                        aria-label={marker.label}
                      />
                    ))}
                    {badgeMarkers.length > 3 && (
                      <span className="text-[10px] text-[var(--foreground-muted)]">+{badgeMarkers.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const NavButton = ({
  ariaLabel,
  onClick,
  icon,
}: {
  ariaLabel: string
  onClick: () => void
  icon: React.ReactNode
}) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    className={cn(
      'inline-flex h-9 w-9 items-center justify-center rounded-xl',
      'border border-[var(--border)] bg-[var(--background-secondary)]',
      'text-[var(--foreground)] hover:border-coral-400/70 hover:text-coral-500',
      'shadow-sm hover:shadow-glow-coral transition-all duration-150'
    )}
  >
    {icon}
  </button>
)

// Helpers
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
const addDays = (date: Date, amount: number) => new Date(date.getTime() + amount * 24 * 60 * 60 * 1000)

const normalizeRange = (a: Date, b: Date) => {
  return isAfter(a, b) ? { start: b, end: a } : { start: a, end: b }
}
