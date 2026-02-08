import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { canAdminDinner, getDinnerAccess } from '@/lib/dinner-authz'

export const dynamic = 'force-dynamic'

// Host approves a pending cohost request
export const POST = withAuth(async (
  _req: NextRequest,
  user,
  context?: { params?: Promise<{ [key: string]: string }> }
) => {
  const params = await context?.params
  const dinnerId = params?.id
  const requestId = params?.requestId
  if (!dinnerId || !requestId) {
    return NextResponse.json({ error: 'Dinner ID and request ID are required' }, { status: 400 })
  }

  const access = await getDinnerAccess(user.id, dinnerId)
  if (!canAdminDinner(access)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const reqRow = await prisma.dinnerCohostRequest.findUnique({
    where: { id: requestId },
    select: { id: true, dinnerId: true, requesterId: true, status: true },
  })

  if (!reqRow || reqRow.dinnerId !== dinnerId) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  // Create collaborator
  await prisma.dinnerCollaborator.upsert({
    where: { dinnerId_userId: { dinnerId, userId: reqRow.requesterId } },
    create: { dinnerId, userId: reqRow.requesterId, role: 'COHOST' },
    update: { role: 'COHOST' },
  })

  await prisma.dinnerCohostRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED' },
  })

  return NextResponse.json({ success: true })
})
