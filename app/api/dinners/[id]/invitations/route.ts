import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { sendDinnerInvitationEmail } from '@/lib/email'
import { format } from 'date-fns'
import crypto from 'node:crypto'

export const dynamic = 'force-dynamic'

function generateToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

/**
 * List invitations for a dinner (host only)
 * GET /api/dinners/[id]/invitations
 */
export const GET = withAuth(async (
  req: NextRequest,
  user,
  context?: { params?: Promise<{ [key: string]: string }> }
) => {
  try {
    const params = await context?.params
    const dinnerId = params?.id
    if (!dinnerId) {
      return NextResponse.json({ error: 'Dinner ID is required' }, { status: 400 })
    }

    const dinner = await prisma.dinner.findUnique({
      where: { id: dinnerId },
      select: { hostId: true },
    })
    if (!dinner) {
      return NextResponse.json({ error: 'Dinner not found' }, { status: 404 })
    }
    if (dinner.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can list invitations' }, { status: 403 })
    }

    const invitations = await prisma.dinnerInvitation.findMany({
      where: { dinnerId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error listing invitations:', error)
    return NextResponse.json(
      { error: 'Failed to list invitations' },
      { status: 500 }
    )
  }
})

/**
 * Create invitations and send email (host only)
 * POST /api/dinners/[id]/invitations
 * Body: { email?: string, emails?: string[] }
 */
export const POST = withAuth(async (
  req: NextRequest,
  user,
  context?: { params?: Promise<{ [key: string]: string }> }
) => {
  try {
    const params = await context?.params
    const dinnerId = params?.id
    if (!dinnerId) {
      return NextResponse.json({ error: 'Dinner ID is required' }, { status: 400 })
    }

    const dinner = await prisma.dinner.findUnique({
      where: { id: dinnerId },
      include: {
        host: { select: { id: true, name: true } },
      },
    })
    if (!dinner) {
      return NextResponse.json({ error: 'Dinner not found' }, { status: 404 })
    }
    if (dinner.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can invite guests' }, { status: 403 })
    }

    const body = await req.json()
    const email = body.email as string | undefined
    const emails = body.emails as string[] | undefined
    const toNormalize = email ? [email] : Array.isArray(emails) ? emails : []
    const normalized = toNormalize
      .map((e: unknown) => (typeof e === 'string' ? e.toLowerCase().trim() : ''))
      .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))

    if (normalized.length === 0) {
      return NextResponse.json(
        { error: 'Provide at least one valid email (email or emails)' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const hostName = dinner.host?.name ?? 'Someone'
    const dinnerDate = format(new Date(dinner.dateTime), 'EEEE, MMMM d, yyyy \'at\' HH:mm')

    const created: Array<{ id: string; email: string; status: string; token: string }> = []
    const skipped: string[] = []
    const failed: string[] = []

    for (const addr of normalized) {
      try {
        const existing = await prisma.dinnerInvitation.findUnique({
          where: {
            dinnerId_email: { dinnerId, email: addr },
          },
        })
        if (existing) {
          skipped.push(addr)
          continue
        }

        const token = generateToken()
        const inv = await prisma.dinnerInvitation.create({
          data: {
            dinnerId,
            email: addr,
            invitedById: user.id,
            token,
          },
        })
        created.push({
          id: inv.id,
          email: inv.email,
          status: inv.status,
          token: inv.token,
        })

        const inviteUrl = `${appUrl}/invitations/${inv.token}`
        const result = await sendDinnerInvitationEmail({
          to: addr,
          hostName,
          dinnerTitle: dinner.title,
          dinnerDate,
          inviteUrl,
          eventId: dinnerId,
          location: dinner.location ?? undefined,
          isPrivateEvent: dinner.visibility === 'PRIVATE',
        })
        if (!result.ok) {
          failed.push(addr)
        }
      } catch (err) {
        console.error(`Failed to create invitation for ${addr}:`, err)
        failed.push(addr)
      }
    }

    return NextResponse.json({
      invitations: created,
      skipped: skipped.length ? skipped : undefined,
      failed: failed.length ? failed : undefined,
    })
  } catch (error) {
    console.error('Error creating invitations:', error)
    return NextResponse.json(
      { error: 'Failed to create invitations' },
      { status: 500 }
    )
  }
})
