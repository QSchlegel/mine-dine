'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, CheckCircle, XCircle, Clock, User, Mail, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Avatar } from '@/components/ui/Avatar'
import Link from 'next/link'

interface HostApplication {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  applicationText: string
  rejectionReason?: string | null
  createdAt: string
  reviewedAt?: string | null
  user: {
    id: string
    name: string | null
    email: string
    bio: string | null
    profileImageUrl: string | null
  }
  reviewedBy?: {
    id: string
    name: string | null
    email: string
  } | null
  onboardedBy?: {
    id: string
    name: string | null
    email: string
  } | null
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [application, setApplication] = useState<HostApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (params.id) {
      fetch(`/api/hosts/applications/${params.id}`)
        .then(async (res) => {
          if (!res.ok) {
            if (res.status === 404) {
              throw new Error('Application not found')
            }
            if (res.status === 403) {
              throw new Error('You do not have permission to view this application')
            }
            const errorData = await res.json().catch(() => ({ error: 'Failed to fetch application' }))
            throw new Error(errorData.error || 'Failed to fetch application')
          }
          return res.json()
        })
        .then((data) => {
          setApplication(data.application)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error fetching application:', err)
          setError(err.message || 'Failed to fetch application')
          setLoading(false)
        })
    }
  }, [params.id])

  const handleReview = async () => {
    if (!application || !reviewAction) return

    if (reviewAction === 'REJECT' && !rejectionReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/hosts/applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          rejectionReason: reviewAction === 'REJECT' ? rejectionReason : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to review application')
      }

      // Update local state
      setApplication(data.application)
      setReviewAction(null)
      setRejectionReason('')

      // Redirect to moderator dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard/moderator')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review application')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingScreen title="Loading application" subtitle="Fetching application details" />
  }

  if (error && !application) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/moderator">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!application) {
    return null
  }

  const getStatusIcon = () => {
    switch (application.status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-amber-600" />
    }
  }

  const getStatusColor = () => {
    switch (application.status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'REJECTED':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'PENDING':
        return 'text-amber-600 bg-amber-50 border-amber-200'
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/moderator">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Host Application</h1>
        </div>

        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Application Status</CardTitle>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor()}`}>
                  {getStatusIcon()}
                  <span className="font-medium">{application.status}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--foreground-secondary)] mb-1">Applied</p>
                  <p className="font-medium text-[var(--foreground)]">
                    {format(new Date(application.createdAt), 'PPp')}
                  </p>
                </div>
                {application.reviewedAt && (
                  <div>
                    <p className="text-[var(--foreground-secondary)] mb-1">Reviewed</p>
                    <p className="font-medium text-[var(--foreground)]">
                      {format(new Date(application.reviewedAt), 'PPp')}
                    </p>
                  </div>
                )}
              </div>
              {application.reviewedBy && (
                <div>
                  <p className="text-[var(--foreground-secondary)] text-sm mb-1">Reviewed by</p>
                  <p className="font-medium text-[var(--foreground)]">
                    {application.reviewedBy.name || application.reviewedBy.email}
                  </p>
                </div>
              )}
              {application.onboardedBy && (
                <div>
                  <p className="text-[var(--foreground-secondary)] text-sm mb-1">Onboarded by</p>
                  <p className="font-medium text-[var(--foreground)]">
                    {application.onboardedBy.name || application.onboardedBy.email}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applicant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Applicant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar
                  src={application.user.profileImageUrl}
                  name={application.user.name || application.user.email}
                  size="lg"
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-[var(--foreground-secondary)]" />
                      <p className="font-medium text-[var(--foreground)]">
                        {application.user.name || 'No name provided'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[var(--foreground-secondary)]" />
                      <p className="text-sm text-[var(--foreground-secondary)]">
                        {application.user.email}
                      </p>
                    </div>
                  </div>
                  {application.user.bio && (
                    <div>
                      <p className="text-sm text-[var(--foreground-secondary)] mb-1">Bio</p>
                      <p className="text-sm text-[var(--foreground)]">{application.user.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Text */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--foreground-secondary)]" />
                <CardTitle>Application Text</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-[var(--foreground)] whitespace-pre-wrap">
                  {application.applicationText}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rejection Reason (if rejected) */}
          {application.status === 'REJECTED' && application.rejectionReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--foreground)] whitespace-pre-wrap">
                  {application.rejectionReason}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Review Form (only for PENDING applications) */}
          {application.status === 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle>Review Application</CardTitle>
                <CardDescription>
                  Approve or reject this host application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setReviewAction('APPROVE')
                      setRejectionReason('')
                      setError(null)
                    }}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setReviewAction('REJECT')
                      setError(null)
                    }}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>

                {reviewAction === 'REJECT' && (
                  <div className="space-y-2">
                    <Textarea
                      label="Rejection Reason"
                      placeholder="Please provide a reason for rejecting this application..."
                      value={rejectionReason}
                      onChange={(e) => {
                        setRejectionReason(e.target.value)
                        if (error) setError(null)
                      }}
                      rows={4}
                      required
                    />
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReviewAction(null)
                          setRejectionReason('')
                          setError(null)
                        }}
                        disabled={submitting}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        onClick={handleReview}
                        isLoading={submitting}
                        disabled={!rejectionReason.trim()}
                        className="flex-1"
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                )}

                {reviewAction === 'APPROVE' && (
                  <div className="space-y-2">
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm text-green-800">
                        This will approve the application and grant the user HOST role. Are you sure?
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReviewAction(null)
                          setError(null)
                        }}
                        disabled={submitting}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleReview}
                        isLoading={submitting}
                        className="flex-1"
                      >
                        Confirm Approval
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Success message after review */}
          {application.status !== 'PENDING' && reviewAction === null && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-800">
                This application has been reviewed. Redirecting to dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
