import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'
import { hashInviteToken } from '@/lib/invites'

export const dynamic = 'force-dynamic'

/**
 * Resolve an invite token.
 * - GUEST_VIEW: returns dinner details (view-only)
 * - COHOST_REQUEST: requires login; creates/returns a pending cohost request
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const tokenHash = hashInviteToken(token)

  const link = await prisma.dinnerInviteLink.findUnique({
    where: { tokenHash },
    include: {
      dinner: {
        select: {
          id: true,
          title: true,
          description: true,
          cuisine: true,
          location: true,
          dateTime: true,
          imageUrl: true,
          visibility: true,
          host: { select: { id: true, name: true, profileImageUrl: true } },
        },
      },
    },
  })

  if (!link) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Invite link expired' }, { status: 410 })
  }
  if (link.maxUses != null && link.uses >= link.maxUses) {
    return NextResponse.json({ error: 'Invite link max uses reached' }, { status: 410 })
  }

  // Count the use (best-effort)
  await prisma.dinnerInviteLink.update({
    where: { id: link.id },
    data: { uses: { increment: 1 } },
  }).catch(() => {})

  if (link.scope === 'GUEST_VIEW') {
    return NextResponse.json({
      scope: link.scope,
      dinner: link.dinner,
    })
  }

  // COHOST_REQUEST: must be logged in
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requesterId = session.user.id

  // Host can't request to be cohost of their own dinner
  const dinner = await prisma.dinner.findUnique({ where: { id: link.dinnerId }, select: { hostId: true } })
  if (dinner?.hostId === requesterId) {
    return NextResponse.json({ error: 'You are already the host' }, { status: 400 })
  }

  const request = await prisma.dinnerCohostRequest.upsert({
    where: { dinnerId_requesterId: { dinnerId: link.dinnerId, requesterId } },
    create: { dinnerId: link.dinnerId, requesterId, status: 'PENDING' },
    update: {},
    select: { id: true, status: true, createdAt: true },
  })

  return NextResponse.json({ scope: link.scope, request })
}
