import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * List users (admin only)
 * GET /api/admin/users?role=ADMIN&q=foo&limit=50
 */
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()

    if (!hasRole(user, 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const role = url.searchParams.get('role')
    const q = url.searchParams.get('q')
    const limitRaw = url.searchParams.get('limit')

    const limit = Math.max(1, Math.min(200, Number(limitRaw ?? '50') || 50))

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role: role as any } : {}),
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { name: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        profileImageUrl: true,
      },
    })

    return NextResponse.json({ users, count: users.length })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Error listing users:', error)
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
  }
}
