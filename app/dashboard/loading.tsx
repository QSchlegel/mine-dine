export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
        <div className="space-y-3">
          <div className="h-8 w-56 rounded-lg bg-[var(--background-secondary)]" />
          <div className="h-4 w-80 max-w-full rounded-lg bg-[var(--background-secondary)]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-28 rounded-2xl bg-[var(--background-secondary)]" />
          <div className="h-28 rounded-2xl bg-[var(--background-secondary)]" />
        </div>
        <div className="h-72 rounded-2xl bg-[var(--background-secondary)]" />
      </div>
    </div>
  )
}
