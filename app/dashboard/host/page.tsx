'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { ChefHat, Calendar, Utensils, Users, CheckCircle, Clock, XCircle } from 'lucide-react'
import HelpButton from '@/components/guides/HelpButton'
import OnboardingTour from '@/components/guides/OnboardingTour'

interface HostApplication {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  applicationText: string
  rejectionReason?: string | null
  reviewedAt?: string | null
}

export default function HostDashboardPage() {
  const router = useRouter()
  const [application, setApplication] = useState<HostApplication | null>(null)
  const [dinnerCount, setDinnerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showTour, setShowTour] = useState(false)
  const [hasCompletedTour, setHasCompletedTour] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/hosts/apply').then((res) => res.json()).catch(() => ({ application: null })),
      fetch('/api/dinners?status=all').then((res) => res.json()).catch(() => ({ dinners: [] })),
    ])
      .then(async ([appData, dinnersData]) => {
        setApplication(appData.application || null)
        setDinnerCount(dinnersData.dinners?.length || 0)
        
        // Check if user has completed host tour
        const profileRes = await fetch('/api/profiles').then((res) => res.json()).catch(() => ({ profile: null }))
        if (profileRes.profile && !profileRes.profile.hasCompletedHostTour && appData.application?.status === 'APPROVED') {
          setShowTour(true)
        } else {
          setHasCompletedTour(true)
        }
        
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching data:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <LoadingScreen title="Loading host dashboard" subtitle="Checking your host status" />
  }

  const getStatusIcon = () => {
    if (!application) return null
    switch (application.status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    if (!application) return 'bg-gray-100 text-gray-800'
    switch (application.status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTourComplete = async () => {
    try {
      await fetch('/api/profiles/tour-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourType: 'host' }),
      })
      setHasCompletedTour(true)
    } catch (error) {
      console.error('Error marking tour as complete:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]/80 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
      <HelpButton pageId="host-dashboard" />
      <OnboardingTour
        tourType="host"
        isOpen={showTour && !hasCompletedTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
      />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-[var(--primary)]" />
            Host Dashboard
          </h1>
          <p className="mt-2 text-[var(--foreground-secondary)]">Manage your hosting activities</p>
        </div>

        {/* Application Status */}
        {application ? (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Application Status
                  {getStatusIcon()}
                </CardTitle>
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor()}`}>
                  {application.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {application.status === 'APPROVED' && (
                <div className="space-y-4">
                  <p className="text-green-700">
                    Congratulations! Your application has been approved. You can now create and manage dinners.
                  </p>
                  <Button onClick={() => router.push('/dashboard/host/dinners')}>
                    Manage Dinners
                  </Button>
                </div>
              )}
              {application.status === 'PENDING' && (
                <div className="space-y-4">
                  <p className="text-yellow-700">
                    Your application is currently under review. We'll notify you once a decision has been made.
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Application submitted: {application.reviewedAt 
                      ? new Date(application.reviewedAt).toLocaleDateString()
                      : 'Recently'}
                  </p>
                </div>
              )}
              {application.status === 'REJECTED' && (
                <div className="space-y-4">
                  <p className="text-red-700">
                    Your application was not approved at this time.
                  </p>
                  {application.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-800 mb-1">Reason:</p>
                      <p className="text-sm text-red-700">{application.rejectionReason}</p>
                    </div>
                  )}
                  <Button variant="outline" onClick={() => router.push('/dashboard/host/apply')}>
                    Reapply
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Become a Host</CardTitle>
              <CardDescription>
                Apply to start hosting dinners on Mine Dine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard/host/apply')}>
                Submit Application
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {application?.status === 'APPROVED' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Dinners</CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dinnerCount}</div>
                <p className="text-xs text-muted-foreground">Dinners created</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        {application?.status === 'APPROVED' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/host/dinners')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  My Dinners
                </CardTitle>
                <CardDescription>
                  View and manage your dinner listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Manage Dinners
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/host/dinners/new')} data-tour="create-dinner">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Create Dinner
                </CardTitle>
                <CardDescription>
                  Create a new dinner experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  New Dinner
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
