import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import { generateDinnerPlan, type DinnerPlanningParams } from '@/lib/ai/dinner-planner'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a host
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.role !== 'HOST') {
      return NextResponse.json(
        { error: 'Only hosts can create dinner plans' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const params: DinnerPlanningParams = {
      cuisine: body.cuisine,
      guestCount: body.guestCount || 8,
      dietaryRestrictions: body.dietaryRestrictions || [],
      budgetRange: body.budgetRange,
      theme: body.theme,
      occasion: body.occasion,
      skillLevel: body.skillLevel || 'intermediate',
      location: body.location,
    }

    // Validate required fields
    if (!params.cuisine || params.guestCount <= 0) {
      return NextResponse.json(
        { error: 'Cuisine and guest count are required' },
        { status: 400 }
      )
    }

    // Generate plan using AI
    const plan = await generateDinnerPlan(params)

    // Store the plan in database (optional - for history)
    // We'll create the DinnerPlan when the dinner is actually created

    return NextResponse.json({
      plan,
      success: true,
    })
  } catch (error) {
    console.error('Error generating dinner plan:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate dinner plan',
      },
      { status: 500 }
    )
  }
}
