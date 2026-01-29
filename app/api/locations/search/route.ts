import { NextRequest, NextResponse } from 'next/server'

/**
 * Location search powered by OpenStreetMap Nominatim.
 * No key required, but keep queries lightweight and cached by Next.js edge.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') || '').trim()

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
      query
    )}`

    const res = await fetch(nominatimUrl, {
      headers: {
        // Nominatim requires a descriptive User-Agent
        'User-Agent': 'MineDine/1.0 (contact@minedine.app)',
      },
      // Prevent accidental caching of sensitive queries in shared caches
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`Nominatim error: ${res.status}`)
    }

    const data = (await res.json()) as Array<any>

    const results = data.map((item) => ({
      label: item.display_name as string,
      lat: item.lat as string,
      lon: item.lon as string,
      city: item.address?.city || item.address?.town || item.address?.village || null,
      state: item.address?.state || null,
      country: item.address?.country || null,
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Location search failed:', error)
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    )
  }
}
