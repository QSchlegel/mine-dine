import { cn } from '@/lib/utils'

interface LoadingScreenProps {
  title?: string
  subtitle?: string
  fullScreen?: boolean
  className?: string
}

export function LoadingScreen({
  title = 'Loading...',
  subtitle,
  fullScreen = true,
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-[var(--background)] px-6',
        fullScreen ? 'min-h-screen' : 'py-16',
        className
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full bg-[var(--primary-light)] blur-xl opacity-80" />
          <div className="absolute inset-0 rounded-full border-2 border-[var(--border)]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--primary)] animate-spin" />
          <div className="absolute inset-2 rounded-full border border-[var(--border-strong)]" />
        </div>
        <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">{title}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-[var(--foreground-secondary)]">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
