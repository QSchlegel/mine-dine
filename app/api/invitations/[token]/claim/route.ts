import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Link the invitation to the current user's account (after signup).
 * Requires auth; invitation email must match the signed-in user's email.
 * POST /api/invitations/[token]/claim
 */
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Sign in to link this event to your account' }, { status: 401 })
    }

    const { token } = await context.params
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const invitation = await prisma.dinnerInvitation.findUnique({
      where: { token },
      select: { id: true, email: true, userId: true },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const invitedEmail = invitation.email.toLowerCase().trim()
    const userEmail = user.email.toLowerCase().trim()
    if (invitedEmail !== userEmail) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      )
    }

    if (invitation.userId) {
      return NextResponse.json({
        success: true,
        message: 'Invitation already linked to your account',
      })
    }

    await prisma.dinnerInvitation.update({
      where: { id: invitation.id },
      data: { userId: user.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Event saved to your account',
    })
  } catch (error) {
    console.error('Error claiming invitation:', error)
    return NextResponse.json(
      { error: 'Failed to link invitation' },
      { status: 500 }
    )
  }
}
