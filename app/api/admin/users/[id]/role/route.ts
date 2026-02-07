import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/admin-actions'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['USER', 'HOST', 'MODERATOR', 'ADMIN']),
})

/**
 * Update a user's role (admin only)
 * POST /api/admin/users/[id]/role
 */
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth()

    if (!hasRole(admin, 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: userId } = await params
    const body = await req.json()
    const validated = updateRoleSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: validated.role },
      select: { id: true, email: true, name: true, role: true },
    })

    await logAdminAction({
      actorId: admin.id,
      action: 'USER_ROLE_UPDATE',
      entityType: 'User',
      entityId: userId,
      decision: validated.role,
      note: null,
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Error updating user role:', error)
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
  }
}
