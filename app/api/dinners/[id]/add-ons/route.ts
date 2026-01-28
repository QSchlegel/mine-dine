import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { dinnerAddOnSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

/**
 * Add an add-on to a dinner
 * POST /api/dinners/[id]/add-ons
 */
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (
  req: NextRequest,
  user,
  context?: { params?: Promise<{ [key: string]: string }> }
) => {
  try {
    const params = await context?.params
    const id = params?.id
    if (!id) {
      return NextResponse.json(
        { error: 'Dinner ID is required' },
        { status: 400 }
      )
    }
    
    const dinner = await prisma.dinner.findUnique({
      where: { id },
    })

    if (!dinner) {
      return NextResponse.json(
        { error: 'Dinner not found' },
        { status: 404 }
      )
    }

    // Check if user is the host or admin
    if (dinner.hostId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = dinnerAddOnSchema.parse(body)

    const addOn = await prisma.dinnerAddOn.create({
      data: {
        dinnerId: id,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
      },
    })

    return NextResponse.json({ addOn }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    console.error('Error creating add-on:', error)
    return NextResponse.json(
      { error: 'Failed to create add-on' },
      { status: 500 }
    )
  }
})
