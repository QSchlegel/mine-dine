'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import Image from 'next/image'
import { getProfileCompletionProgress, type ProfileCompletionResult } from '@/lib/profile'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  bio: string | null
  profileImageUrl: string | null
  coverImageUrl: string | null
  userTags: Array<{
    tag: {
      id: string
      name: string
      category: string
    }
  }>
}

interface Tag {
  id: string
  name: string
  category: string
}

function ProfilePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isSetupMode = searchParams.get('setup') === 'true'
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [completion, setCompletion] = useState<ProfileCompletionResult | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ name?: string; bio?: string; tags?: string }>({})

  useEffect(() => {
    Promise.all([
      fetch('/api/profiles').then((res) => res.json()),
      fetch('/api/tags').then((res) => res.json()),
    ])
      .then(([profileData, tagsData]) => {
        setProfile(profileData.profile)
        setAllTags(tagsData.tags || [])
        if (profileData.profile) {
          setName(profileData.profile.name || '')
          setBio(profileData.profile.bio || '')
          setSelectedTags(profileData.profile.userTags.map((ut: any) => ut.tag.id))
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching data:', err)
        setLoading(false)
      })
  }, [])

  // Update completion progress when form data changes
  useEffect(() => {
    const currentProfile = {
      name,
      bio,
      userTags: selectedTags.map(tagId => ({ tag: { id: tagId } })),
    }
    const completionData = getProfileCompletionProgress(currentProfile)
    setCompletion(completionData)
  }, [name, bio, selectedTags])

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: { name?: string; bio?: string; tags?: string } = {}
    
    if (!name || name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }
    
    if (!bio || bio.trim().length < 20) {
      errors.bio = 'Bio must be at least 20 characters'
    }
    
    if (selectedTags.length < 3) {
      errors.tags = 'Please select at least 3 tags (recommended)'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    // Validate before saving
    if (!validateForm()) {
      setNotification({ type: 'error', message: 'Please fix the errors below before saving' })
      setTimeout(() => setNotification(null), 5000)
      return
    }

    setSaving(true)
    setValidationErrors({})
    
    try {
      await Promise.all([
        fetch('/api/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, bio }),
        }),
        fetch('/api/profiles/tags', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagIds: selectedTags }),
        }),
      ])

      setNotification({ type: 'success', message: 'Profile updated successfully!' })
      setTimeout(() => setNotification(null), 5000)

      // If in setup mode and profile is now complete, redirect to dashboard
      if (isSetupMode && completion?.isComplete) {
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setNotification({ type: 'error', message: 'Failed to save profile. Please try again.' })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  const tagsByCategory = allTags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {} as Record<string, Tag[]>)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {isSetupMode && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-indigo-900 mb-2">Welcome to Mine Dine!</h2>
            <p className="text-indigo-700 text-sm">
              Complete your profile to start discovering amazing dining experiences. Fill in your name, bio, and select some tags to help us match you with the perfect hosts.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isSetupMode ? 'Complete Your Profile' : 'Edit Profile'}
          </h1>
          {!isSetupMode && (
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          )}
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <p className="font-medium">{notification.message}</p>
          </div>
        )}

        {/* Profile Completion Progress */}
        {completion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Profile Completion</CardTitle>
              <CardDescription>
                {completion.isComplete
                  ? 'Your profile is complete!'
                  : `Complete your profile to improve your matching experience`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      completion.isComplete ? 'bg-green-600' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${completion.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {completion.progress}% complete
                </p>
                {!completion.isComplete && completion.recommendations.length > 0 && (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {completion.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.profileImageUrl && (
                <div className="relative h-32 w-32 rounded-full overflow-hidden">
                  <Image
                    src={profile.profileImageUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: undefined })
                    }
                  }}
                  error={validationErrors.name}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {name.length >= 2 ? (
                    <span className="text-green-600">✓ Name looks good</span>
                  ) : (
                    <span>Minimum 2 characters required</span>
                  )}
                </p>
              </div>
              <div>
                <Textarea
                  label="Bio"
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value)
                    if (validationErrors.bio) {
                      setValidationErrors({ ...validationErrors, bio: undefined })
                    }
                  }}
                  rows={4}
                  maxLength={500}
                  error={validationErrors.bio}
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    {bio.length >= 20 ? (
                      <span className="text-green-600">✓ Bio looks good</span>
                    ) : (
                      <span>{20 - bio.length} more characters needed (minimum 20)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {bio.length} / 500 characters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags & Interests</CardTitle>
              <CardDescription>
                Select at least 3 tags that describe you to help with matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validationErrors.tags && (
                <p className="text-sm text-red-600 mb-4">{validationErrors.tags}</p>
              )}
              <div className="space-y-6">
                {Object.entries(tagsByCategory).map(([category, tags]) => (
                  <div key={category}>
                    <h3 className="font-medium text-gray-900 mb-2 capitalize">
                      {category.toLowerCase()}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            toggleTag(tag.id)
                            if (validationErrors.tags) {
                              setValidationErrors({ ...validationErrors, tags: undefined })
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedTags.includes(tag.id)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                {selectedTags.length >= 3 ? (
                  <span className="text-green-600">✓ {selectedTags.length} tags selected (recommended: 3+)</span>
                ) : (
                  <span>Selected: {selectedTags.length} / 3 (recommended minimum)</span>
                )}
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              onClick={handleSave} 
              isLoading={saving} 
              className="flex-1"
              disabled={saving}
            >
              {isSetupMode ? 'Complete Profile' : 'Save Profile'}
            </Button>
            {isSetupMode && (
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={saving}
              >
                Skip for Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  )
}
