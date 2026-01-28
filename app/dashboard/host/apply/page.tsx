'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface HostApplication {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  applicationText: string
  rejectionReason?: string | null
  reviewedAt?: string | null
}

export default function HostApplyPage() {
  const router = useRouter()
  const [applicationText, setApplicationText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingApplication, setExistingApplication] = useState<HostApplication | null>(null)
  const [loadingApplication, setLoadingApplication] = useState(true)

  useEffect(() => {
    // Check for existing application
    fetch('/api/hosts/apply')
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            // Unauthorized - redirect to login
            router.push('/login')
            return
          }
          const errorData = await res.json().catch(() => ({ error: 'Failed to fetch application' }))
          throw new Error(errorData.error || 'Failed to fetch application')
        }
        return res.json()
      })
      .then((data) => {
        if (data && data.application) {
          setExistingApplication(data.application)
          setApplicationText(data.application.applicationText)
        }
        setLoadingApplication(false)
      })
      .catch((err) => {
        console.error('Error fetching application:', err)
        // Only set loading to false if not redirecting
        if (err.message !== 'Failed to fetch application' || !err.message.includes('401')) {
          setLoadingApplication(false)
        }
      })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (applicationText.length < 50) {
      setError('Application text must be at least 50 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/hosts/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationText,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle unauthorized errors
        if (response.status === 401) {
          router.push('/login')
          return
        }
        // Map error messages to user-friendly text
        const errorMessage = data.error === 'Unauthorized' 
          ? 'Please log in to continue'
          : data.error || 'Failed to submit application'
        throw new Error(errorMessage)
      }

      setExistingApplication(data)
      router.push('/dashboard/host')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  if (loadingApplication) {
    return <LoadingScreen title="Loading application" subtitle="Checking your host status" />
  }

  if (existingApplication) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Host Application Status</CardTitle>
              <CardDescription>
                Your application to become a host
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground-secondary)]">Status</p>
                <p className={`mt-1 text-sm ${
                  existingApplication.status === 'APPROVED' ? 'text-green-600' :
                  existingApplication.status === 'REJECTED' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {existingApplication.status}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--foreground-secondary)]">Application Text</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)] whitespace-pre-wrap">
                  {existingApplication.applicationText}
                </p>
              </div>

              {existingApplication.rejectionReason && (
                <div>
                  <p className="text-sm font-medium text-[var(--foreground-secondary)]">Rejection Reason</p>
                  <p className="mt-1 text-sm text-red-600">
                    {existingApplication.rejectionReason}
                  </p>
                </div>
              )}

              {existingApplication.status === 'APPROVED' && (
                <Button
                  onClick={() => router.push('/dashboard/host/dinners')}
                  className="w-full"
                >
                  Go to Host Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Apply to Become a Host</CardTitle>
            <CardDescription>
              Tell us why you'd like to host dinners on Mine Dine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                label="Application Text"
                placeholder="Tell us about your cooking experience, what makes you a great host, and what kind of dining experiences you'd like to offer..."
                value={applicationText}
                onChange={(e) => {
                  setApplicationText(e.target.value)
                  // Clear error when user starts typing
                  if (error) {
                    setError(null)
                  }
                }}
                rows={10}
                required
                minLength={50}
                error={error || undefined}
              />
              <p className={`text-sm ${
                applicationText.length < 50 
                  ? 'text-red-500' 
                  : 'text-gray-500'
              }`}>
                {applicationText.length}/50 characters {applicationText.length < 50 && '(minimum 50)'}
              </p>

              <Button
                type="submit"
                isLoading={loading}
                disabled={applicationText.length < 50}
                className="w-full"
              >
                Submit Application
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
