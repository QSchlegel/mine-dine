import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { userUpdateSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

/**
 * Get current user's profile
 * GET /api/profiles
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

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
})

/**
 * Update current user's profile
 * PATCH /api/profiles
 */
export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const validatedData = userUpdateSchema.parse(body)

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: validatedData,
      include: {
        userTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
})
