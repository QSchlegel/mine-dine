import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { hostApplicationSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

/**
 * Submit a host application
 * POST /api/hosts/apply
 */
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    // Check if user already has an application
    const existingApplication = await prisma.hostApplication.findUnique({
      where: { userId: user.id },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You already have a pending application' },
        { status: 400 }
      )
    }

    // Check if user is already a host
    if (user.role === 'HOST' || user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'You are already a host' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = hostApplicationSchema.parse(body)

    const application = await prisma.hostApplication.create({
      data: {
        userId: user.id,
        applicationText: validatedData.applicationText,
        status: 'PENDING',
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    console.error('Error creating host application:', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
})

/**
 * Get current user's host application status
 * GET /api/hosts/apply
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const application = await prisma.hostApplication.findUnique({
      where: { userId: user.id },
      include: {
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ application: null })
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Error fetching host application:', error)
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    )
  }
})
