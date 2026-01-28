import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dinnerPlan = await prisma.dinnerPlan.findUnique({
      where: { dinnerId: id },
      include: {
        dinner: {
          include: {
            host: true,
          },
        },
      },
    })

    if (!dinnerPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Check if user owns the dinner
    if (dinnerPlan.dinner.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ plan: dinnerPlan })
  } catch (error) {
    console.error('Error fetching dinner plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dinner plan' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Verify dinner exists and user owns it
    const dinner = await prisma.dinner.findUnique({
      where: { id },
    })

    if (!dinner) {
      return NextResponse.json({ error: 'Dinner not found' }, { status: 404 })
    }

    if (dinner.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update or create plan
    const dinnerPlan = await prisma.dinnerPlan.upsert({
      where: { dinnerId: id },
      update: {
        menuItems: body.menuItems,
        ingredientList: body.ingredientList,
        prepTimeline: body.prepTimeline,
        pricingBreakdown: body.pricingBreakdown,
        aiResponse: body.aiResponse || undefined,
      },
      create: {
        dinnerId: id,
        menuItems: body.menuItems,
        ingredientList: body.ingredientList,
        prepTimeline: body.prepTimeline,
        pricingBreakdown: body.pricingBreakdown,
        aiPrompt: body.aiPrompt || '',
        aiResponse: body.aiResponse || '',
      },
    })

    return NextResponse.json({ plan: dinnerPlan })
  } catch (error) {
    console.error('Error updating dinner plan:', error)
    return NextResponse.json(
      { error: 'Failed to update dinner plan' },
      { status: 500 }
    )
  }
}
