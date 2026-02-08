import { NextRequest, NextResponse } from 'next/server'
import { TagCategory } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULT_TAGS: { name: string; category: TagCategory }[] = [
  { name: 'Italian', category: TagCategory.CUISINE },
  { name: 'French', category: TagCategory.CUISINE },
  { name: 'Japanese', category: TagCategory.CUISINE },
  { name: 'Mexican', category: TagCategory.CUISINE },
  { name: 'Indian', category: TagCategory.CUISINE },
  { name: 'Thai', category: TagCategory.CUISINE },
  { name: 'Mediterranean', category: TagCategory.CUISINE },
  { name: 'American', category: TagCategory.CUISINE },
  { name: 'Chinese', category: TagCategory.CUISINE },
  { name: 'Korean', category: TagCategory.CUISINE },
  { name: 'Vegetarian', category: TagCategory.DIETARY },
  { name: 'Vegan', category: TagCategory.DIETARY },
  { name: 'Gluten-Free', category: TagCategory.DIETARY },
  { name: 'Dairy-Free', category: TagCategory.DIETARY },
  { name: 'Nut-Free', category: TagCategory.DIETARY },
  { name: 'Pescatarian', category: TagCategory.DIETARY },
  { name: 'Keto', category: TagCategory.DIETARY },
  { name: 'Halal', category: TagCategory.DIETARY },
  { name: 'Wine Lover', category: TagCategory.INTEREST },
  { name: 'Foodie', category: TagCategory.INTEREST },
  { name: 'Cooking Enthusiast', category: TagCategory.INTEREST },
  { name: 'Spice Lover', category: TagCategory.INTEREST },
  { name: 'Fine Dining', category: TagCategory.INTEREST },
  { name: 'Street Food', category: TagCategory.INTEREST },
  { name: 'Organic', category: TagCategory.INTEREST },
  { name: 'Farm to Table', category: TagCategory.INTEREST },
  { name: 'Craft Beer', category: TagCategory.INTEREST },
  { name: 'Social', category: TagCategory.LIFESTYLE },
  { name: 'Intimate Gatherings', category: TagCategory.LIFESTYLE },
  { name: 'Family Friendly', category: TagCategory.LIFESTYLE },
  { name: 'Date Night', category: TagCategory.LIFESTYLE },
  { name: 'Business Casual', category: TagCategory.LIFESTYLE },
  { name: 'Adventure Seeker', category: TagCategory.LIFESTYLE },
  { name: 'Professional Chef', category: TagCategory.SKILL },
  { name: 'Home Cook', category: TagCategory.SKILL },
  { name: 'Pastry Expert', category: TagCategory.SKILL },
  { name: 'BBQ Master', category: TagCategory.SKILL },
  { name: 'Sommelier', category: TagCategory.SKILL },
  { name: 'Baker', category: TagCategory.SKILL },
]

/**
 * Get all tags
 * GET /api/tags
 *
 * Query params:
 * - category: Filter by tag category (CUISINE, DIETARY, INTEREST, LIFESTYLE, SKILL, OTHER)
 *
 * If no tags exist in the database, default tags are seeded automatically.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    let tags = await prisma.tag.findMany({
      where: category ? { category: category as TagCategory } : undefined,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    // Seed default tags if table is empty (e.g. fresh deploy or DB reset)
    if (tags.length === 0 && !category) {
      await prisma.tag.createMany({
        data: DEFAULT_TAGS,
        skipDuplicates: true,
      })
      tags = await prisma.tag.findMany({
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      })
    }

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}
