import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Get invitation by token (public, for invitee page).
 * GET /api/invitations/[token]
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const invitation = await prisma.dinnerInvitation.findUnique({
      where: { token },
      include: {
        dinner: {
          select: {
            id: true,
            title: true,
            description: true,
            dateTime: true,
            location: true,
            cuisine: true,
            maxGuests: true,
            host: {
              select: { id: true, name: true, profileImageUrl: true },
            },
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        dinner: invitation.dinner,
      },
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    )
  }
}
