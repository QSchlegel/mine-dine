'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Avatar } from '@/components/ui/Avatar'
import Link from 'next/link'

interface HostApplication {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  applicationText: string
  createdAt: string
  reviewedAt?: string | null
  user: {
    id: string
    name: string | null
    email: string
    profileImageUrl: string | null
  }
  reviewedBy?: {
    id: string
    name: string | null
    email: string
  } | null
}

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

export default function ApplicationsListPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<HostApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  useEffect(() => {
    fetchApplications()
  }, [statusFilter])

  const fetchApplications = async () => {
    setLoading(true)
    setError(null)

    try {
      const url = statusFilter === 'ALL'
        ? '/api/hosts/applications'
        : `/api/hosts/applications?status=${statusFilter}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch applications')
      }

      setApplications(data.applications || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-amber-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'REJECTED':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'PENDING':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      default:
        return ''
    }
  }

  const statusCounts = {
    ALL: applications.length,
    PENDING: applications.filter((app) => app.status === 'PENDING').length,
    APPROVED: applications.filter((app) => app.status === 'APPROVED').length,
    REJECTED: applications.filter((app) => app.status === 'REJECTED').length,
  }

  if (loading) {
    return <LoadingScreen title="Loading applications" subtitle="Fetching host applications" />
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/moderator">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Host Applications</h1>
          <p className="text-[var(--foreground-secondary)] mt-2">
            Review and manage all host applications
          </p>
        </div>

        {/* Status Filter */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[var(--foreground-secondary)]" />
              <CardTitle>Filter by Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  className="relative"
                >
                  {status}
                  {statusCounts[status] > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                      {statusCounts[status]}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-[var(--foreground-secondary)] text-lg mb-2">
                  No applications found
                </p>
                <p className="text-[var(--foreground-secondary)] text-sm">
                  {statusFilter === 'ALL'
                    ? 'There are no host applications yet.'
                    : `There are no ${statusFilter.toLowerCase()} applications.`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Link
                key={app.id}
                href={`/dashboard/moderator/applications/${app.id}`}
                className="block"
              >
                <Card hover="subtle" className="cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={app.user.profileImageUrl}
                        name={app.user.name || app.user.email}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-[var(--foreground)] truncate">
                              {app.user.name || app.user.email}
                            </h3>
                            <p className="text-sm text-[var(--foreground-secondary)] truncate">
                              {app.user.email}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor(
                              app.status
                            )}`}
                          >
                            {getStatusIcon(app.status)}
                            <span className="text-sm font-medium">{app.status}</span>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--foreground)] line-clamp-2 mb-3">
                          {app.applicationText}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-[var(--foreground-secondary)]">
                          <span>
                            Applied: {format(new Date(app.createdAt), 'PPp')}
                          </span>
                          {app.reviewedAt && (
                            <span>
                              Reviewed: {format(new Date(app.reviewedAt), 'PPp')}
                            </span>
                          )}
                          {app.reviewedBy && (
                            <span>
                              By: {app.reviewedBy.name || app.reviewedBy.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
