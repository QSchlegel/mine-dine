import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import { generateDinnerPlan, type DinnerPlanningParams } from '@/lib/ai/dinner-planner'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { section, params } = body

    if (!section || !params) {
      return NextResponse.json(
        { error: 'Section and params are required' },
        { status: 400 }
      )
    }

    // Regenerate the entire plan (we can enhance this later to regenerate specific sections)
    const plan = await generateDinnerPlan(params as DinnerPlanningParams)

    // Return only the requested section if specified
    if (section === 'menu') {
      return NextResponse.json({ menuItems: plan.menuItems })
    } else if (section === 'ingredients') {
      return NextResponse.json({ ingredientList: plan.ingredientList })
    } else if (section === 'timeline') {
      return NextResponse.json({ prepTimeline: plan.prepTimeline })
    } else if (section === 'pricing') {
      return NextResponse.json({ pricingBreakdown: plan.pricingBreakdown })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error regenerating plan section:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to regenerate plan',
      },
      { status: 500 }
    )
  }
}
