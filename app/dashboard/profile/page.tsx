'use client'

import { useState, useEffect, useRef, Suspense, type ChangeEvent } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import Image from 'next/image'
import { getProfileCompletionProgress, type ProfileCompletionResult } from '@/lib/profile'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  bio: string | null
  profileImageUrl: string | null
  profileImagePublicUrl?: string | null
  coverImageUrl: string | null
  profileVisibility: 'EVERYONE' | 'ENGAGED_ONLY'
  role: 'USER' | 'HOST' | 'ADMIN' | 'MODERATOR'
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
  const [profileVisibility, setProfileVisibility] = useState<'EVERYONE' | 'ENGAGED_ONLY'>('EVERYONE')
  const [completion, setCompletion] = useState<ProfileCompletionResult | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ name?: string; bio?: string; tags?: string }>({})
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null) // display (may be signed)
  const [persistedProfileImageUrl, setPersistedProfileImageUrl] = useState<string | null>(null) // stored in DB
  const [role, setRole] = useState<UserProfile['role'] | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
          setProfileVisibility(profileData.profile.profileVisibility || 'EVERYONE')
          const displayUrl = profileData.profile.profileImageUrl || null
          const stableUrl = profileData.profile.profileImagePublicUrl || displayUrl
          setProfileImageUrl(displayUrl)
          setPersistedProfileImageUrl(stableUrl)
          setRole(profileData.profile.role || 'USER')
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
          body: JSON.stringify({ name, bio, profileVisibility, profileImageUrl: persistedProfileImageUrl }),
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

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 10 * 1024 * 1024

    if (!allowedMimeTypes.includes(file.type)) {
      setImageError('Only JPG, PNG, WEBP, or GIF files are allowed.')
      event.target.value = ''
      return
    }

    if (file.size > maxSize) {
      setImageError('File is too large. Maximum size is 10MB.')
      event.target.value = ''
      return
    }

    setUploadingImage(true)
    setImageError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'profile')

    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      const displayUrl = data.signedUrl || data.url
      setProfileImageUrl(displayUrl)
      setPersistedProfileImageUrl(data.url)
      setProfile((prev) => (prev ? { ...prev, profileImageUrl: displayUrl } : prev))

      // Persist immediately so reloads keep the image even if the user doesn't click Save
      try {
        await fetch('/api/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileImageUrl: data.url }),
        })
      } catch (persistErr) {
        console.error('Failed to persist profile image:', persistErr)
      }

      setNotification({ type: 'success', message: 'Photo uploaded successfully!' })
      setTimeout(() => setNotification(null), 5000)
    } catch (error: any) {
      const message = error?.message || 'Failed to upload photo. Please try again.'
      setImageError(message)
      setNotification({ type: 'error', message })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleRemoveImage = () => {
    setProfileImageUrl(null)
    setPersistedProfileImageUrl(null)
    setProfile((prev) => (prev ? { ...prev, profileImageUrl: null } : prev))
  }

  if (loading) {
    return <LoadingScreen title="Loading profile" subtitle="Getting your details ready" />
  }

  const tagsByCategory = allTags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {} as Record<string, Tag[]>)

  const privacyOptions = [
    {
      value: 'EVERYONE' as const,
      title: 'Everyone',
      description: 'Visible to all Mine Dine members browsing hosts and guests.',
    },
    {
      value: 'ENGAGED_ONLY' as const,
      title: 'Engaged only',
      description: 'Visible after you engage (booking, match, or message).',
    },
  ]

  const roleConfig: Record<UserProfile['role'], { label: string; variant: 'coral' | 'blue' | 'success' | 'warning' | 'default' }> = {
    USER: { label: 'Guest', variant: 'default' },
    HOST: { label: 'Host', variant: 'coral' },
    ADMIN: { label: 'Admin', variant: 'warning' },
    MODERATOR: { label: 'Moderator', variant: 'blue' },
  }

  return (
    <div className="min-h-screen bg-[var(--background)]/80 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {isSetupMode && (
          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--primary-light)] p-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Welcome to Mine Dine!</h2>
            <p className="text-[var(--foreground-secondary)] text-sm">
              Complete your profile to start discovering amazing dining experiences. Fill in your name, bio, and select some tags to help us match you with the perfect hosts.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-[var(--foreground)]">
                {isSetupMode ? 'Complete Your Profile' : 'Edit Profile'}
              </h1>
              {role && (
                <Badge variant={roleConfig[role].variant} size="md" glow>
                  {roleConfig[role].label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-[var(--foreground-secondary)]">
              Keep your profile current to get better matches and quicker bookings.
            </p>
          </div>
          {!isSetupMode && (
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          )}
        </div>

        {notification && (
          <div
            className={`rounded-xl border p-4 ${
              notification.type === 'success'
                ? 'border-success-100 bg-success-50 text-success-600 dark:border-success-600/40 dark:bg-success-600/20 dark:text-success-500'
                : 'border-danger-100 bg-danger-50 text-danger-600 dark:border-danger-600/40 dark:bg-danger-600/20 dark:text-danger-500'
            }`}
          >
            <p className="font-medium">{notification.message}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Help people know who they are dining with.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden ring-2 ring-[var(--background)] bg-[var(--background-tertiary)] flex items-center justify-center text-xs text-[var(--foreground-muted)]">
                    {profileImageUrl ? (
                      <Image
                        src={profileImageUrl}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="px-4 text-center">Add a clear, friendly headshot</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">Profile photo</p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        Higher-quality, safe-for-work photos improve trust and matches.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={uploadingImage}
                      >
                        {profileImageUrl ? 'Change photo' : 'Upload photo'}
                      </Button>
                      {profileImageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveImage}
                          disabled={uploadingImage}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {imageError && (
                      <p className="text-xs text-danger-600">{imageError}</p>
                    )}
                    <p className="text-[10px] uppercase tracking-wide text-[var(--foreground-muted)]">
                      Max 10MB • jpg, png, webp, gif • Safe-for-work only
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
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
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">
                    {name.length >= 2 ? (
                      <span className="text-success-600">✓ Name looks good</span>
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
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {bio.length >= 20 ? (
                        <span className="text-success-600">✓ Bio looks good</span>
                      ) : (
                        <span>{20 - bio.length} more characters needed (minimum 20)</span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
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
                  Select at least 3 tags that describe you to help with matching.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {validationErrors.tags && (
                  <p className="text-sm text-danger-600 mb-4">{validationErrors.tags}</p>
                )}
                <div className="space-y-6">
                  {Object.entries(tagsByCategory).map(([category, tags]) => (
                    <div key={category}>
                      <h3 className="font-medium text-[var(--foreground)] mb-2 capitalize">
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
                            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                              selectedTags.includes(tag.id)
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-[var(--glow-primary)]'
                                : 'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)] border-[var(--border)] hover:bg-[var(--background-secondary)]'
                            }`}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mt-4">
                  {selectedTags.length >= 3 ? (
                    <span className="text-success-600">✓ {selectedTags.length} tags selected (recommended: 3+)</span>
                  ) : (
                    <span>Selected: {selectedTags.length} / 3 (recommended minimum)</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control who can see your full profile details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {privacyOptions.map((option) => {
                  const isSelected = profileVisibility === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfileVisibility(option.value)}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--primary-light)] shadow-[var(--glow-primary)]'
                          : 'border-[var(--border)] bg-[var(--background-secondary)] hover:border-[var(--border-strong)]'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">{option.title}</p>
                          <p className="text-xs text-[var(--foreground-secondary)] mt-1">
                            {option.description}
                          </p>
                        </div>
                        <span
                          className={`h-4 w-4 rounded-full border-2 ${
                            isSelected ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--border-strong)]'
                          }`}
                        />
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleSave} 
                isLoading={saving} 
                className="flex-1 min-w-[200px]"
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

          <div className="space-y-6">
            {completion && !completion.isComplete && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Completion</CardTitle>
                  <CardDescription>
                    Complete your profile to improve your matching experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="w-full bg-[var(--background-tertiary)] rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-300 bg-[var(--primary)]"
                        style={{ width: `${completion.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      {completion.progress}% complete
                    </p>
                    {completion.recommendations.length > 0 && (
                      <ul className="text-sm text-[var(--foreground-secondary)] space-y-1">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Preview</CardTitle>
                <CardDescription>How you’ll appear to others.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden bg-[var(--background-tertiary)]">
                    {profileImageUrl ? (
                      <Image
                        src={profileImageUrl}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[var(--foreground)]">{name || 'Your name'}</p>
                      {role && (
                        <Badge variant={roleConfig[role].variant} size="sm">
                          {roleConfig[role].label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {profileVisibility === 'EVERYONE' ? 'Visible to everyone' : 'Visible after engagement'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[var(--foreground-secondary)] mt-4">
                  {bio || 'Add a friendly bio to help others feel comfortable dining with you.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedTags.slice(0, 3).map((tagId) => {
                    const tag = allTags.find((t) => t.id === tagId)
                    return (
                      <span
                        key={tagId}
                        className="px-2 py-0.5 rounded-full text-xs bg-[var(--background-tertiary)] text-[var(--foreground-secondary)] border border-[var(--border)]"
                      >
                        {tag?.name || 'Tag'}
                      </span>
                    )
                  })}
                  {selectedTags.length > 3 && (
                    <span className="text-xs text-[var(--foreground-muted)]">+{selectedTags.length - 3} more</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <LoadingScreen title="Loading profile" subtitle="Getting your details ready" />
    }>
      <ProfilePageContent />
    </Suspense>
  )
}
