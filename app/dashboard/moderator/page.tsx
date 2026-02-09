import { redirect } from 'next/navigation'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Shield, Users, Calendar, DollarSign, CheckCircle, XCircle, Clock, Bot } from 'lucide-react'

// Mark this page as dynamic since it uses getCurrentUser() which calls headers()
export const dynamic = 'force-dynamic'

export default async function ModeratorDashboardPage() {
  const user = await getCurrentUser()

  if (!user || !hasRole(user, 'MODERATOR')) {
    redirect('/dashboard')
  }

  // Fetch pending items and stats
  const [pendingApplications, pendingDinners, stats] = await Promise.all([
    prisma.hostApplication.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    }),
    prisma.dinner.findMany({
      where: {
        moderationStatus: 'PENDING',
        status: { in: ['DRAFT', 'PUBLISHED'] },
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    }),
    prisma.$transaction([
      prisma.hostApplication.count({
        where: {
          onboardedById: user.id,
          status: 'APPROVED',
        },
      }),
      prisma.revenueShare.findMany({
        where: { moderatorId: user.id },
        select: {
          amount: true,
          status: true,
        },
      }),
    ]),
  ])

  const [hostsOnboarded, revenueShares] = stats
  const totalRevenue = revenueShares.reduce((sum, share) => sum + share.amount, 0)
  const pendingRevenue = revenueShares
    .filter((share) => share.status === 'PENDING')
    .reduce((sum, share) => sum + share.amount, 0)

  return (
    <div className="min-h-screen bg-[var(--background)]/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              Moderator Dashboard
            </h1>
          </div>
          <p className="text-[var(--foreground-secondary)]">
            Review host applications, moderate dinners, and track your revenue shares
          </p>
          <div className="mt-4">
            <Link
              href="/minebot/moderator"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 transition-colors"
            >
              <Bot className="w-4 h-4" />
              Open Moderator Bot
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--background-secondary)] rounded-lg p-6 border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
              <p className="text-sm text-[var(--foreground-secondary)] mb-1">
                Pending Applications
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {pendingApplications.length}
              </p>
            </div>
              <Users className="h-8 w-8 text-blue-500 dark:text-blue-300" />
            </div>
          </div>

          <div className="bg-[var(--background-secondary)] rounded-lg p-6 border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
              <p className="text-sm text-[var(--foreground-secondary)] mb-1">
                Pending Dinners
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {pendingDinners.length}
              </p>
            </div>
              <Calendar className="h-8 w-8 text-purple-500 dark:text-purple-300" />
            </div>
          </div>

          <div className="bg-[var(--background-secondary)] rounded-lg p-6 border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
              <p className="text-sm text-[var(--foreground-secondary)] mb-1">
                Hosts Onboarded
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {hostsOnboarded}
              </p>
            </div>
              <CheckCircle className="h-8 w-8 text-green-500 dark:text-emerald-300" />
            </div>
          </div>

          <div className="bg-[var(--background-secondary)] rounded-lg p-6 border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
              <p className="text-sm text-[var(--foreground-secondary)] mb-1">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                €{totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                €{pendingRevenue.toFixed(2)} pending
              </p>
            </div>
              <DollarSign className="h-8 w-8 text-amber-500 dark:text-amber-300" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pending Applications */}
          <div className="bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Pending Host Applications
              </h2>
              <Link
                href="/dashboard/moderator/applications"
                className="text-sm text-blue-600 dark:text-blue-300 hover:underline"
              >
                View all
              </Link>
            </div>
            {pendingApplications.length === 0 ? (
              <p className="text-[var(--foreground-secondary)] text-sm">
                No pending applications
              </p>
            ) : (
              <div className="space-y-3">
                {pendingApplications.map((app) => (
                  <Link
                    key={app.id}
                    href={`/dashboard/moderator/applications/${app.id}`}
                    className="block p-3 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {app.user.profileImageUrl ? (
                        <img
                          src={getProxiedImageUrl(app.user.profileImageUrl) ?? app.user.profileImageUrl}
                          alt={app.user.name || 'User'}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-coral-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                          {app.user.name?.[0] || app.user.email?.[0] || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {app.user.name || app.user.email}
                        </p>
                        <p className="text-xs text-[var(--foreground-secondary)]">
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending Dinners */}
          <div className="bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Pending Dinner Moderation
              </h2>
              <Link
                href="/dashboard/moderator/dinners"
                className="text-sm text-blue-600 dark:text-blue-300 hover:underline"
              >
                View all
              </Link>
            </div>
            {pendingDinners.length === 0 ? (
              <p className="text-[var(--foreground-secondary)] text-sm">
                No pending dinners
              </p>
            ) : (
              <div className="space-y-3">
                {pendingDinners.map((dinner) => (
                  <Link
                    key={dinner.id}
                    href={`/dashboard/moderator/dinners/${dinner.id}`}
                    className="block p-3 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {dinner.host.profileImageUrl ? (
                        <img
                          src={getProxiedImageUrl(dinner.host.profileImageUrl) ?? dinner.host.profileImageUrl}
                          alt={dinner.host.name || 'Host'}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                          {dinner.host.name?.[0] || 'H'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {dinner.title}
                        </p>
                        <p className="text-xs text-[var(--foreground-secondary)]">
                          Host: {dinner.host.name}
                        </p>
                      </div>
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Revenue Section */}
        <div className="bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Revenue Shares
            </h2>
            <Link
              href="/dashboard/moderator/revenue"
              className="text-sm text-blue-600 dark:text-blue-300 hover:underline"
            >
              View details
            </Link>
          </div>
          <p className="text-[var(--foreground-secondary)] text-sm mb-4">
            Track your earnings from onboarding hosts and referral bookings
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--foreground-secondary)] mb-1">
                Total Earned
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                €{totalRevenue.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--foreground-secondary)] mb-1">
                Pending Payout
              </p>
              <p className="text-2xl font-bold text-amber-600">
                €{pendingRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
