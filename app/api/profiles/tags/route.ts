import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTagsSchema = z.object({
  tagIds: z.array(z.string()),
})

/**
 * Update user's tags
 * PATCH /api/profiles/tags
 */
export const dynamic = 'force-dynamic'

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const validatedData = updateTagsSchema.parse(body)

    // Remove duplicates from tagIds
    const uniqueTagIds = [...new Set(validatedData.tagIds)]
    
    if (uniqueTagIds.length !== validatedData.tagIds.length) {
      console.warn(`Removed ${validatedData.tagIds.length - uniqueTagIds.length} duplicate tag IDs`)
    }
    
    // Delete existing tags first
    await prisma.userTag.deleteMany({
      where: { userId: user.id },
    })

    // Create new tags
    if (uniqueTagIds.length > 0) {
      const createResult = await prisma.userTag.createMany({
        data: uniqueTagIds.map((tagId) => ({
          userId: user.id,
          tagId,
        })),
        skipDuplicates: true, // Safety measure in case of race conditions
      })
      
      console.log(`Created ${createResult.count} user tags for user ${user.id} (expected ${uniqueTagIds.length})`)
      
      // Verify all tags were created
      if (createResult.count < uniqueTagIds.length) {
        // If some tags weren't created, try to find which ones and create them individually
        const createdTags = await prisma.userTag.findMany({
          where: {
            userId: user.id,
            tagId: { in: uniqueTagIds },
          },
          select: { tagId: true },
        })
        
        const createdTagIds = new Set(createdTags.map(t => t.tagId))
        const missingTagIds = uniqueTagIds.filter(id => !createdTagIds.has(id))
        
        if (missingTagIds.length > 0) {
          console.warn(`Missing ${missingTagIds.length} tags, attempting to create individually:`, missingTagIds)
          // Try creating missing tags individually
          for (const tagId of missingTagIds) {
            try {
              await prisma.userTag.create({
                data: {
                  userId: user.id,
                  tagId,
                },
              })
            } catch (individualError) {
              console.error(`Failed to create tag ${tagId}:`, individualError)
            }
          }
        }
      }
    }

    const updatedProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating tags:', error)
    return NextResponse.json(
      { error: 'Failed to update tags' },
      { status: 500 }
    )
  }
})
