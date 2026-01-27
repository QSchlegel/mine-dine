import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tourType } = body

    if (tourType !== 'guest' && tourType !== 'host') {
      return NextResponse.json({ error: 'Invalid tour type' }, { status: 400 })
    }

    const updateData: { hasCompletedGuestTour?: boolean; hasCompletedHostTour?: boolean } = {}
    if (tourType === 'guest') {
      updateData.hasCompletedGuestTour = true
    } else {
      updateData.hasCompletedHostTour = true
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking tour as complete:', error)
    return NextResponse.json(
      { error: 'Failed to update tour status' },
      { status: 500 }
    )
  }
}
