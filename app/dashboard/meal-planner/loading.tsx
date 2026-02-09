export default function MealPlannerLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded-lg bg-[var(--background-secondary)]" />
          <div className="h-4 w-96 max-w-full rounded-lg bg-[var(--background-secondary)]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.75fr_1fr] gap-6">
          <div className="h-[32rem] rounded-2xl bg-[var(--background-secondary)]" />
          <div className="h-[32rem] rounded-2xl bg-[var(--background-secondary)]" />
        </div>
      </div>
    </div>
  )
}
