export default function HostDashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded-lg bg-[var(--background-secondary)]" />
          <div className="h-4 w-72 max-w-full rounded-lg bg-[var(--background-secondary)]" />
        </div>
        <div className="h-56 rounded-2xl bg-[var(--background-secondary)]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 rounded-2xl bg-[var(--background-secondary)]" />
          <div className="h-28 rounded-2xl bg-[var(--background-secondary)]" />
          <div className="h-28 rounded-2xl bg-[var(--background-secondary)]" />
        </div>
      </div>
    </div>
  )
}
