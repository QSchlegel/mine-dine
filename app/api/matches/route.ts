import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Get user's matches (mutual likes)
 * GET /api/matches
 *
 * Returns all hosts where there's a mutual LIKE between the user and host
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Find all hosts the user has liked
    const userLikes = await prisma.swipeAction.findMany({
      where: {
        userId: user.id,
        action: 'LIKE',
      },
      select: {
        targetUserId: true,
        createdAt: true,
      },
    })

    if (userLikes.length === 0) {
      return NextResponse.json({
        matches: [],
        total: 0,
      })
    }

    const likedHostIds = userLikes.map(like => like.targetUserId)

    // Find mutual likes (hosts who have also liked the user)
    const mutualLikes = await prisma.swipeAction.findMany({
      where: {
        userId: {
          in: likedHostIds,
        },
        targetUserId: user.id,
        action: 'LIKE',
      },
      select: {
        userId: true,
        createdAt: true,
      },
    })

    const matchedHostIds = new Set(mutualLikes.map(like => like.userId))

    // Get details of matched hosts
    const matchedHosts = await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(matchedHostIds),
        },
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
          take: 3,
          select: {
            id: true,
            title: true,
            cuisine: true,
            imageUrl: true,
            basePricePerPerson: true,
            dateTime: true,
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
    })

    // Combine with match timestamp and format response
    const matches = matchedHosts.map(host => {
      const userLike = userLikes.find(like => like.targetUserId === host.id)
      const hostLike = mutualLikes.find(like => like.userId === host.id)

      // Match timestamp is the later of the two likes
      const matchedAt = userLike && hostLike
        ? new Date(Math.max(
            new Date(userLike.createdAt).getTime(),
            new Date(hostLike.createdAt).getTime()
          )).toISOString()
        : new Date().toISOString()

      return {
        id: host.id,
        name: host.name,
        bio: host.bio,
        profileImageUrl: host.profileImageUrl,
        coverImageUrl: host.coverImageUrl,
        tags: host.userTags.map(ut => ut.tag),
        upcomingDinners: host.dinners,
        dinnerCount: host._count.dinners,
        matchedAt,
      }
    })

    // Sort by match time (newest first)
    matches.sort((a, b) =>
      new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()
    )

    return NextResponse.json({
      matches,
      total: matches.length,
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
})

/**
 * Check if there's a match with a specific host
 * GET /api/matches?hostId=xxx
 */
export async function checkMatch(userId: string, hostId: string): Promise<boolean> {
  // Check if user liked host
  const userLike = await prisma.swipeAction.findUnique({
    where: {
      userId_targetUserId: {
        userId,
        targetUserId: hostId,
      },
    },
  })

  if (!userLike || userLike.action !== 'LIKE') {
    return false
  }

  // Check if host liked user
  const hostLike = await prisma.swipeAction.findUnique({
    where: {
      userId_targetUserId: {
        userId: hostId,
        targetUserId: userId,
      },
    },
  })

  return hostLike?.action === 'LIKE'
}
