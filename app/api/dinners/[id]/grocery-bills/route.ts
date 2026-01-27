import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createGroceryBillSchema = z.object({
  imageUrl: z.string().url(),
  totalAmount: z.number().positive().optional(),
})

/**
 * Upload a grocery bill for a dinner
 * POST /api/dinners/[id]/grocery-bills
 */
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (
  req: NextRequest,
  user,
  context?: { params?: { id?: string } }
) => {
  try {
    const id = context?.params?.id
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
    const validatedData = createGroceryBillSchema.parse(body)

    const groceryBill = await prisma.groceryBill.create({
      data: {
        dinnerId: id,
        imageUrl: validatedData.imageUrl,
        totalAmount: validatedData.totalAmount,
      },
    })

    return NextResponse.json({ groceryBill }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating grocery bill:', error)
    return NextResponse.json(
      { error: 'Failed to upload grocery bill' },
      { status: 500 }
    )
  }
})
