import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { canAdminDinner, getDinnerAccess } from '@/lib/dinner-authz'
import { generateInviteToken, hashInviteToken } from '@/lib/invites'

export const dynamic = 'force-dynamic'

// List invite links (host/owner only)
export const GET = withAuth(async (
  _req: NextRequest,
  user,
  context?: { params?: Promise<{ [key: string]: string }> }
) => {
  const params = await context?.params
  const dinnerId = params?.id
  if (!dinnerId) return NextResponse.json({ error: 'Dinner ID is required' }, { status: 400 })

  const access = await getDinnerAccess(user.id, dinnerId)
  if (!canAdminDinner(access)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const links = await prisma.dinnerInviteLink.findMany({
    where: { dinnerId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      scope: true,
      expiresAt: true,
      maxUses: true,
      uses: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ links })
})

// Create invite link (host/owner only)
export const POST = withAuth(async (
  req: NextRequest,
  user,
  context?: { params?: Promise<{ [key: string]: string }> }
) => {
  const params = await context?.params
  const dinnerId = params?.id
  if (!dinnerId) return NextResponse.json({ error: 'Dinner ID is required' }, { status: 400 })

  const access = await getDinnerAccess(user.id, dinnerId)
  if (!canAdminDinner(access)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const scope = body?.scope === 'COHOST_REQUEST' ? 'COHOST_REQUEST' : 'GUEST_VIEW'
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null
  const maxUses = Number.isFinite(Number(body?.maxUses)) ? Number(body.maxUses) : null

  const token = generateInviteToken()
  const tokenHash = hashInviteToken(token)

  const link = await prisma.dinnerInviteLink.create({
    data: {
      dinnerId,
      createdById: user.id,
      scope,
      tokenHash,
      expiresAt,
      maxUses,
    },
    select: { id: true, scope: true, createdAt: true },
  })

  // Return the raw token ONCE to the creator
  return NextResponse.json({ link, token }, { status: 201 })
})
