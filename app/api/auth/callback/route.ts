import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'
import { isProfileComplete } from '@/lib/profile'
import { headers } from 'next/headers'

/**
 * Auth callback route - handles post-authentication redirects
 * Better Auth handles the actual authentication, this route checks profile completion
 * and redirects to appropriate page
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user) {
      // Not authenticated, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Get full user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if profile is complete
    const profileComplete = isProfileComplete(user)

    // Determine redirect URL
    // New users or users with incomplete profiles go to profile setup
    // Users with complete profiles go to dashboard
    const redirectUrl = profileComplete
      ? '/dashboard'
      : '/dashboard/profile?setup=true'

    const baseUrl = new URL(request.url)
    return NextResponse.redirect(new URL(redirectUrl, baseUrl.origin))
  } catch (error) {
    console.error('Auth callback error:', error)
    const baseUrl = new URL(request.url)
    return NextResponse.redirect(new URL('/login', baseUrl.origin))
  }
}
