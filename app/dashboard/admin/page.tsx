import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck,
  Users,
  ChefHat,
  ClipboardList,
  AlertTriangle,
  Banknote,
  Gauge,
  ArrowRight,
} from 'lucide-react'

import { getCurrentUser, hasRole } from '@/lib/auth'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { prisma } from '@/lib/prisma'

// Mark as dynamic because we read the current user via headers()
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()

  if (!user || !hasRole(user, 'ADMIN')) {
    redirect('/dashboard')
  }

  const [
    totalUsers,
    hostCount,
    moderatorCount,
    pendingHostApplicationsCount,
    pendingDinnerCount,
    activeBookingsCount,
    revenueShareAgg,
    recentHostApplications,
    pendingDinners,
    pendingRevenueShares,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'HOST' } }),
    prisma.user.count({ where: { role: { in: ['MODERATOR', 'ADMIN'] } } }),
    prisma.hostApplication.count({ where: { status: 'PENDING' } }),
    prisma.dinner.count({ where: { moderationStatus: 'PENDING', status: { in: ['DRAFT', 'PUBLISHED'] } } }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.revenueShare.aggregate({
      _count: true,
      _sum: { amount: true },
      where: { status: 'PENDING' },
    }),
    prisma.hostApplication.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: { id: true, name: true, email: true, profileImageUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.dinner.findMany({
      where: { moderationStatus: 'PENDING', status: { in: ['DRAFT', 'PUBLISHED'] } },
      include: {
        host: { select: { id: true, name: true, profileImageUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    }),
    prisma.revenueShare.findMany({
      where: { status: 'PENDING' },
      include: {
        booking: {
          select: {
            id: true,
            dinner: { select: { title: true } },
            user: { select: { name: true, email: true } },
          },
        },
        moderator: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const pendingRevenueTotal = revenueShareAgg._sum.amount || 0
  const pendingRevenueCount = revenueShareAgg._count || 0

  return (
    <div className="min-h-screen bg-[var(--background)]/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Admin Control Center</h1>
              <p className="text-[var(--foreground-secondary)]">Platform health, risk, and payouts at a glance</p>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          <StatTile
            icon={<Users className="h-5 w-5 text-blue-500" />}
            label="Total Users"
            value={totalUsers}
          />
          <StatTile
            icon={<ChefHat className="h-5 w-5 text-emerald-500" />}
            label="Approved Hosts"
            value={hostCount}
          />
          <StatTile
            icon={<ShieldCheck className="h-5 w-5 text-amber-500" />}
            label="Moderators/Admins"
            value={moderatorCount}
          />
          <StatTile
            icon={<ClipboardList className="h-5 w-5 text-orange-500" />}
            label="Pending Host Apps"
            value={pendingHostApplicationsCount}
            highlight
          />
          <StatTile
            icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
            label="Pending Dinners"
            value={pendingDinnerCount}
            highlight
          />
          <StatTile
            icon={<Gauge className="h-5 w-5 text-purple-500" />}
            label="Active Bookings"
            value={activeBookingsCount}
          />
          <StatTile
            icon={<Banknote className="h-5 w-5 text-emerald-600" />}
            label="Pending Payouts"
            value={`€${pendingRevenueTotal.toFixed(2)}`}
            sub={`Across ${pendingRevenueCount} shares`}
            highlight
          />
        </div>

        {/* Queues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <Panel
            title="Host Applications"
            actionHref="/dashboard/moderator/applications"
            actionLabel="Open queue"
          >
            {recentHostApplications.length === 0 ? (
              <EmptyRow text="No pending applications" />
            ) : (
              <div className="space-y-3">
                {recentHostApplications.map((app) => (
                  <Link
                    key={app.id}
                    href={`/dashboard/moderator/applications/${app.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                  >
                    <AvatarCircle name={app.user.name || app.user.email} src={app.user.profileImageUrl} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        {app.user.name || app.user.email}
                      </p>
                      <p className="text-xs text-[var(--foreground-secondary)]">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--foreground-secondary)]" />
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Dinner Moderation"
            actionHref="/dashboard/moderator/dinners"
            actionLabel="Moderate"
          >
            {pendingDinners.length === 0 ? (
              <EmptyRow text="No dinners awaiting review" />
            ) : (
              <div className="space-y-3">
                {pendingDinners.map((dinner) => (
                  <Link
                    key={dinner.id}
                    href={`/dashboard/moderator/dinners/${dinner.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                  >
                    <AvatarCircle name={dinner.host.name} src={dinner.host.profileImageUrl} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{dinner.title}</p>
                      <p className="text-xs text-[var(--foreground-secondary)]">Host: {dinner.host.name}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--foreground-secondary)]" />
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Revenue */}
        <Panel
          title="Payouts & Revenue Shares"
          actionHref="/dashboard/moderator/revenue"
          actionLabel="Review payouts"
        >
          <p className="text-sm text-[var(--foreground-secondary)] mb-4">
            Track pending payouts and resolve blockers before releasing funds.
          </p>
          {pendingRevenueShares.length === 0 ? (
            <EmptyRow text="No pending revenue shares" />
          ) : (
            <div className="space-y-3">
              {pendingRevenueShares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]"
                >
                  <Banknote className="h-4 w-4 text-emerald-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      €{share.amount.toFixed(2)} • {share.shareType}
                    </p>
                    <p className="text-xs text-[var(--foreground-secondary)] truncate">
                      {share.booking.dinner?.title || 'Dinner booking'} — Moderator {share.moderator.name || share.moderator.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/moderator/revenue"
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Manage
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

interface StatTileProps {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  highlight?: boolean
}

function StatTile({ icon, label, value, sub, highlight }: StatTileProps) {
  return (
    <div
      className={`rounded-lg border p-4 bg-[var(--background-secondary)] ${
        highlight ? 'border-amber-300/60 shadow-[0_10px_30px_-12px_rgba(245,158,11,0.25)]' : 'border-[var(--border)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--foreground-secondary)]">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
          {sub && <p className="text-xs text-[var(--foreground-secondary)]">{sub}</p>}
        </div>
        <div className="h-10 w-10 rounded-full bg-[var(--background)] flex items-center justify-center border border-[var(--border)]">
          {icon}
        </div>
      </div>
    </div>
  )
}

interface PanelProps {
  title: string
  actionHref: string
  actionLabel: string
  children: React.ReactNode
}

function Panel({ title, actionHref, actionLabel, children }: PanelProps) {
  return (
    <div className="bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">{title}</h2>
        <Link href={actionHref} className="text-sm text-blue-600 hover:underline">
          {actionLabel}
        </Link>
      </div>
      {children}
    </div>
  )
}

interface AvatarCircleProps {
  name?: string | null
  src?: string | null
}

function AvatarCircle({ name, src }: AvatarCircleProps) {
  const fallback = name?.[0] || '?'

  if (src) {
    return (
      <img
        src={getProxiedImageUrl(src) ?? src}
        alt={name || 'User'}
        className="h-10 w-10 rounded-full object-cover"
      />
    )
  }

  return (
    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
      {fallback}
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-[var(--foreground-secondary)]">{text}</p>
}
