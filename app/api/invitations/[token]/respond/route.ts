import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Accept or decline a dinner invitation (by token, no auth required).
 * POST /api/invitations/[token]/respond
 * Body: { status: 'ACCEPTED' | 'DECLINED' }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const body = await req.json()
    const status = body.status === 'ACCEPTED' || body.status === 'DECLINED' ? body.status : null
    if (!status) {
      return NextResponse.json(
        { error: 'Body must include status: "ACCEPTED" or "DECLINED"' },
        { status: 400 }
      )
    }

    const invitation = await prisma.dinnerInvitation.findUnique({
      where: { token },
      include: {
        dinner: {
          select: {
            id: true,
            title: true,
            dateTime: true,
            hostId: true,
            host: { select: { name: true } },
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const user = await getCurrentUser()
    const updateData: { status: 'ACCEPTED' | 'DECLINED'; userId?: string } = { status }
    if (user) {
      updateData.userId = user.id
    }

    await prisma.dinnerInvitation.update({
      where: { id: invitation.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      status,
      dinner: invitation.dinner
        ? {
            id: invitation.dinner.id,
            title: invitation.dinner.title,
            dateTime: invitation.dinner.dateTime,
            hostName: invitation.dinner.host?.name,
          }
        : undefined,
    })
  } catch (error) {
    console.error('Error responding to invitation:', error)
    return NextResponse.json(
      { error: 'Failed to respond to invitation' },
      { status: 500 }
    )
  }
}
