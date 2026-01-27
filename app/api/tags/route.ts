import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Get all tags
 * GET /api/tags
 *
 * Query params:
 * - category: Filter by tag category (CUISINE, DIETARY, INTEREST, LIFESTYLE, SKILL, OTHER)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const tags = await prisma.tag.findMany({
      where: category ? { category: category as any } : undefined,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}
