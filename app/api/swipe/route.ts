import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema for swipe action
const swipeActionSchema = z.object({
  hostId: z.string().cuid(),
  action: z.enum(['LIKE', 'PASS']),
})

/**
 * Get swipeable hosts for discovery
 * GET /api/swipe
 *
 * Returns hosts that:
 * - Have HOST or ADMIN role
 * - User hasn't swiped on yet
 * - Are not the current user
 * - Have at least one published dinner (active hosts)
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Fetch user's tags ONCE (not inside the loop)
    const userTags = await prisma.userTag.findMany({
      where: { userId: user.id },
      select: { tagId: true },
    })
    const userTagIds = new Set(userTags.map(ut => ut.tagId))

    // Get IDs of hosts the user has already swiped on
    const existingSwipes = await prisma.swipeAction.findMany({
      where: { userId: user.id },
      select: { targetUserId: true },
    })
    const swipedHostIds = existingSwipes.map(s => s.targetUserId)

    // Find hosts the user can swipe on
    const hosts = await prisma.user.findMany({
      where: {
        AND: [
          // Must be a HOST or ADMIN
          {
            role: {
              in: ['HOST', 'ADMIN'],
            },
          },
          // Not the current user
          {
            id: {
              not: user.id,
            },
          },
          // Not already swiped on
          {
            id: {
              notIn: swipedHostIds,
            },
          },
          // Has at least one published dinner (active host)
          {
            dinners: {
              some: {
                status: 'PUBLISHED',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        bio: true,
        profileImageUrl: true,
        coverImageUrl: true,
        userTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        dinners: {
          where: {
            status: 'PUBLISHED',
          },
          take: 3, // Sample dinners
          select: {
            id: true,
            title: true,
            cuisine: true,
            imageUrl: true,
            basePricePerPerson: true,
          },
          orderBy: {
            dateTime: 'asc',
          },
        },
        _count: {
          select: {
            dinners: {
              where: {
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
      orderBy: {
        // Order by most active hosts (with most dinners)
        dinners: {
          _count: 'desc',
        },
      },
      take: 50, // Limit to 50 hosts per request
    })

    // Get all host IDs to batch fetch ratings
    const hostIds = hosts.map(h => h.id)

    // Batch fetch ratings for all hosts in a single query
    const hostRatings = await prisma.review.groupBy({
      by: ['dinnerId'],
      where: {
        dinner: {
          hostId: { in: hostIds },
        },
      },
      _avg: { rating: true },
      _count: { rating: true },
    })

    // Get dinner to host mapping for rating lookup
    const dinnerHostMap = await prisma.dinner.findMany({
      where: { hostId: { in: hostIds } },
      select: { id: true, hostId: true },
    })
    const dinnerToHost = new Map(dinnerHostMap.map(d => [d.id, d.hostId]))

    // Aggregate ratings by host
    const hostRatingMap = new Map<string, { totalRating: number; count: number }>()
    for (const rating of hostRatings) {
      const hostId = dinnerToHost.get(rating.dinnerId)
      if (hostId) {
        const current = hostRatingMap.get(hostId) || { totalRating: 0, count: 0 }
        current.totalRating += (rating._avg.rating || 0) * rating._count.rating
        current.count += rating._count.rating
        hostRatingMap.set(hostId, current)
      }
    }

    // Process hosts with ratings and match scores (no additional queries)
    const hostsWithRating = hosts.map((host) => {
      // Calculate tag match score using pre-fetched user tags
      const hostTagIds = host.userTags.map(ut => ut.tag.id)
      const matchingTags = hostTagIds.filter(id => userTagIds.has(id))
      const matchScore = hostTagIds.length > 0
        ? matchingTags.length / hostTagIds.length
        : 0

      // Get pre-fetched rating
      const ratingData = hostRatingMap.get(host.id)
      const rating = ratingData && ratingData.count > 0
        ? ratingData.totalRating / ratingData.count
        : 0
      const reviewCount = ratingData?.count || 0

      return {
        ...host,
        tags: host.userTags.map(ut => ut.tag),
        userTags: undefined, // Remove nested structure
        rating,
        reviewCount,
        matchScore,
      }
    })

    // Sort by match score (hosts with more matching tags first)
    hostsWithRating.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json({
      hosts: hostsWithRating,
      total: hostsWithRating.length,
    })
  } catch (error) {
    console.error('Error fetching swipeable hosts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hosts' },
      { status: 500 }
    )
  }
})

/**
 * Record a swipe action
 * POST /api/swipe
 *
 * Body: { hostId: string, action: 'LIKE' | 'PASS' }
 *
 * If action is LIKE, checks for mutual like (match)
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const validatedData = swipeActionSchema.parse(body)

    // Check if target user exists and is a host
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.hostId },
      select: {
        id: true,
        role: true,
        name: true,
        profileImageUrl: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Host not found' },
        { status: 404 }
      )
    }

    if (targetUser.role === 'USER') {
      return NextResponse.json(
        { error: 'Cannot swipe on non-host users' },
        { status: 400 }
      )
    }

    // Check if already swiped
    const existingSwipe = await prisma.swipeAction.findUnique({
      where: {
        userId_targetUserId: {
          userId: user.id,
          targetUserId: validatedData.hostId,
        },
      },
    })

    if (existingSwipe) {
      return NextResponse.json(
        { error: 'Already swiped on this host' },
        { status: 400 }
      )
    }

    // Create swipe action
    const swipeAction = await prisma.swipeAction.create({
      data: {
        userId: user.id,
        targetUserId: validatedData.hostId,
        action: validatedData.action,
      },
    })

    let matched = false
    let matchData = null

    // Check for mutual like (match)
    if (validatedData.action === 'LIKE') {
      const mutualLike = await prisma.swipeAction.findFirst({
        where: {
          userId: validatedData.hostId,
          targetUserId: user.id,
          action: 'LIKE',
        },
      })

      if (mutualLike) {
        matched = true
        matchData = {
          userId: user.id,
          hostId: validatedData.hostId,
          hostName: targetUser.name,
          hostImage: targetUser.profileImageUrl,
          matchedAt: new Date().toISOString(),
        }
      }
    }

    return NextResponse.json({
      swipeAction,
      matched,
      matchData,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error recording swipe action:', error)
    return NextResponse.json(
      { error: 'Failed to record swipe' },
      { status: 500 }
    )
  }
})
