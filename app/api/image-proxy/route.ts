import { NextRequest, NextResponse } from 'next/server'
import { getDisplayImageUrl } from '@/lib/storage'

const ALLOWED_HOSTS = [
  'storage.railway.app',
  /^[a-z0-9-]+\.storage\.railway\.app$/,
  /\.amazonaws\.com$/,
  'gateway.pinata.cloud',
  /\.pinata\.cloud$/,
  'ipfs.io',
  /\.ipfs\.dweb\.link$/,
]

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname
    return ALLOWED_HOSTS.some((allowed) =>
      typeof allowed === 'string' ? host === allowed : allowed.test(host)
    )
  } catch {
    return false
  }
}

/**
 * GET /api/image-proxy?url=...
 * Proxies images from private storage (e.g. Railway) by signing the URL server-side
 * and streaming the response. Use for profile/cover images that may be in a private bucket.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json({ error: 'Invalid or missing url' }, { status: 400 })
  }

  const displayUrl = await getDisplayImageUrl(url)
  if (!displayUrl) {
    return NextResponse.json({ error: 'Failed to resolve image' }, { status: 502 })
  }

  try {
    const res = await fetch(displayUrl, {
      headers: { Accept: 'image/*' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream image failed' },
        { status: res.status === 404 ? 404 : 502 }
      )
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const body = res.body
    if (!body) {
      return NextResponse.json({ error: 'No image body' }, { status: 502 })
    }
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('Image proxy fetch error:', err)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 502 })
  }
}
