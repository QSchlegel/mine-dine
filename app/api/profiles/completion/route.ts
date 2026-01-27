import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { getProfileCompletionProgress } from '@/lib/profile'
import { prisma } from '@/lib/prisma'

/**
 * Get current user's profile completion status
 * GET /api/profiles/completion
 */
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const completion = getProfileCompletionProgress(profile)

    return NextResponse.json({
      completion,
      profile: {
        name: profile.name,
        bio: profile.bio,
        tagCount: profile.userTags.length,
      },
    })
  } catch (error) {
    console.error('Error fetching profile completion:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile completion' },
      { status: 500 }
    )
  }
})
