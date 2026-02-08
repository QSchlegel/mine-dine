import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateICS, getGoogleCalendarUrl, getOutlookCalendarUrl, getDefaultEndTime } from '@/lib/calendar'

export const dynamic = 'force-dynamic'

/**
 * Calendar export endpoint
 * GET /api/events/[id]/calendar?format=ics|google|outlook
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const format = req.nextUrl.searchParams.get('format') || 'ics'

    const dinner = await prisma.dinner.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!dinner) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const start = new Date(dinner.dateTime)
    const end = getDefaultEndTime(start)
    const hostName = dinner.host?.name || 'Your host'

    const event = {
      title: dinner.title,
      description: `${dinner.description}\n\nHosted by ${hostName}`,
      location: dinner.location,
      start,
      end,
    }

    switch (format) {
      case 'google': {
        const url = getGoogleCalendarUrl(event)
        return NextResponse.redirect(url)
      }

      case 'outlook': {
        const url = getOutlookCalendarUrl(event)
        return NextResponse.redirect(url)
      }

      case 'ics':
      default: {
        const icsContent = generateICS(event)
        const filename = `${dinner.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`

        return new NextResponse(icsContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        })
      }
    }
  } catch (error) {
    console.error('Error generating calendar export:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar export' },
      { status: 500 }
    )
  }
}
