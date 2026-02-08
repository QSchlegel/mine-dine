import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { sendDinnerInvitationEmail } from '@/lib/email'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

/**
 * Resend invitation email (host only)
 * POST /api/dinners/[id]/invitations/[invitationId]/resend
 */
export const POST = withAuth(async (
  req: NextRequest,
  user,
  context?: { params?: Promise<{ [key: string]: string }> }
) => {
  try {
    const params = await context?.params
    const dinnerId = params?.id
    const invitationId = params?.invitationId
    if (!dinnerId || !invitationId) {
      return NextResponse.json(
        { error: 'Dinner ID and invitation ID are required' },
        { status: 400 }
      )
    }

    const invitation = await prisma.dinnerInvitation.findUnique({
      where: { id: invitationId },
      include: {
        dinner: {
          include: {
            host: { select: { name: true } },
          },
        },
      },
    })

    if (!invitation || invitation.dinnerId !== dinnerId) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }
    if (invitation.dinner.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can resend invitations' }, { status: 403 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const inviteUrl = `${appUrl}/invitations/${invitation.token}`
    const hostName = invitation.dinner.host?.name ?? 'Someone'
    const dinnerDate = format(new Date(invitation.dinner.dateTime), 'EEEE, MMMM d, yyyy \'at\' HH:mm')

    const result = await sendDinnerInvitationEmail({
      to: invitation.email,
      hostName,
      dinnerTitle: invitation.dinner.title,
      dinnerDate,
      inviteUrl,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to resend invitation' },
      { status: 500 }
    )
  }
})
