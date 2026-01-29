import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { generateProactiveSuggestion } from '@/lib/ai/proactive-assistant'
import { getProfileCompletionProgress } from '@/lib/profile'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })
    let userRole: string | null = null
    let isProfileComplete = false

    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      userRole = user?.role ?? null

      // Fetch profile completion status
      const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          userTags: {
            include: {
              tag: true,
            },
          },
        },
      })

      if (profile) {
        const completion = getProfileCompletionProgress(profile)
        isProfileComplete = completion.isComplete
      }
    }

    const suggestion = await generateProactiveSuggestion({
      path: body?.path,
      idleSeconds: body?.idleSeconds,
      mode: body?.mode,
      userRole,
      isProfileComplete,
    })

    return NextResponse.json({ suggestion }, { status: 200 })
  } catch (error) {
    console.error('Error generating proactive assistant suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to generate assistant suggestion' },
      { status: 500 }
    )
  }
}
