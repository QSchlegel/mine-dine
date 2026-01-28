/**
 * Profile completion utilities
 * Functions to check if a user profile is complete and calculate completion progress
 */

export interface ProfileCompletionResult {
  isComplete: boolean
  progress: number // 0-100
  missingFields: string[]
  recommendations: string[]
}

export interface UserProfile {
  name: string | null
  bio: string | null
  userTags?: Array<{ tag: { id: string } }> | []
  email?: string | null
  profileImageUrl?: string | null
}

/**
 * Check if a user profile is complete
 * Profile is complete if:
 * - Name is set (min 2 characters)
 * - Bio is set (min 20 characters)
 * - At least 3 tags are selected (recommended)
 */
export function isProfileComplete(user: UserProfile | null): boolean {
  if (!user) return false

  const hasName = Boolean(user.name && user.name.trim().length >= 2)
  const hasBio = Boolean(user.bio && user.bio.trim().length >= 20)
  const hasTags = Boolean(user.userTags && user.userTags.length >= 3)

  return hasName && hasBio && hasTags
}

/**
 * Get profile completion progress and details
 * Returns completion percentage and missing fields
 */
export function getProfileCompletionProgress(
  user: UserProfile | null
): ProfileCompletionResult {
  if (!user) {
    return {
      isComplete: false,
      progress: 0,
      missingFields: ['name', 'bio', 'tags'],
      recommendations: ['Add your name', 'Write a bio', 'Select at least 3 tags'],
    }
  }

  const missingFields: string[] = []
  const recommendations: string[] = []
  let completedFields = 0
  const totalFields = 3

  // Check name
  const hasName = user.name && user.name.trim().length >= 2
  if (hasName) {
    completedFields++
  } else {
    missingFields.push('name')
    if (!user.name || user.name.trim().length === 0) {
      recommendations.push('Add your name (min 2 characters)')
    } else {
      recommendations.push('Name must be at least 2 characters')
    }
  }

  // Check bio
  const hasBio = user.bio && user.bio.trim().length >= 20
  if (hasBio) {
    completedFields++
  } else {
    missingFields.push('bio')
    if (!user.bio || user.bio.trim().length === 0) {
      recommendations.push('Write a bio (min 20 characters)')
    } else {
      const remaining = 20 - (user.bio.trim().length || 0)
      recommendations.push(`Bio needs ${remaining} more characters (min 20)`)
    }
  }

  // Check tags
  const tagCount = user.userTags?.length || 0
  const hasTags = tagCount >= 3
  if (hasTags) {
    completedFields++
  } else {
    missingFields.push('tags')
    if (tagCount === 0) {
      recommendations.push('Select at least 3 tags to help with matching')
    } else {
      const remaining = 3 - tagCount
      recommendations.push(`Select ${remaining} more tag${remaining > 1 ? 's' : ''} (recommended: 3+)`)
    }
  }

  const progress = Math.round((completedFields / totalFields) * 100)
  const isComplete = completedFields === totalFields

  return {
    isComplete,
    progress,
    missingFields,
    recommendations,
  }
}

/**
 * Get a user-friendly message about profile completion
 */
export function getProfileCompletionMessage(
  completion: ProfileCompletionResult
): string {
  if (completion.isComplete) {
    return 'Your profile is complete!'
  }

  if (completion.progress === 0) {
    return 'Complete your profile to get started'
  }

  return `Your profile is ${completion.progress}% complete`
}
