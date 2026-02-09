export default function DinnersLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-10 w-72 rounded-lg bg-[var(--background-secondary)]" />
          <div className="h-5 w-[28rem] max-w-full rounded-lg bg-[var(--background-secondary)]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="h-96 rounded-2xl bg-[var(--background-secondary)]" />
          <div className="h-96 rounded-2xl bg-[var(--background-secondary)]" />
          <div className="h-96 rounded-2xl bg-[var(--background-secondary)]" />
        </div>
      </div>
    </div>
  )
}
