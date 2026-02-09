import { NextRequest, NextResponse } from 'next/server'
import { getDisplayImageUrl } from '@/lib/storage'

const ALLOWED_HOSTS = [
  'storage.railway.app',
  /^[a-z0-9-]+\.storage\.railway\.app$/,
  /\.amazonaws\.com$/,
  'gateway.pinata.cloud',
  /\.pinata\.cloud$/,
  'ipfs.io',
  'cloudflare-ipfs.com',
  'w3s.link',
  'dweb.link',
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

const IPFS_PUBLIC_GATEWAY = 'https://ipfs.io'

function extractIpfsParts(url: URL): { cid: string; suffix: string; search: string } | null {
  // Path-based gateways: /ipfs/<cid>/<optional-path>
  const pathMatch = url.pathname.match(/^\/ipfs\/([^/]+)(\/.*)?$/)
  if (pathMatch) {
    return {
      cid: pathMatch[1],
      suffix: pathMatch[2] || '',
      search: url.search || '',
    }
  }

  // Subdomain-based gateways: <cid>.ipfs.dweb.link/<optional-path>
  const parts = url.hostname.split('.')
  const ipfsIndex = parts.indexOf('ipfs')
  if (ipfsIndex > 0) {
    const cid = parts[ipfsIndex - 1]
    if (!cid) return null
    return {
      cid,
      suffix: url.pathname === '/' ? '' : url.pathname,
      search: url.search || '',
    }
  }

  return null
}

function getCandidateUrls(url: string): string[] {
  try {
    const parsed = new URL(url)
    const ipfs = extractIpfsParts(parsed)
    if (!ipfs) return [url]
    return [`${IPFS_PUBLIC_GATEWAY}/ipfs/${ipfs.cid}${ipfs.suffix}${ipfs.search}`]
  } catch {
    return [url]
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      headers: {
        Accept: 'image/*,*/*;q=0.8',
      },
      next: { revalidate: 3600 },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
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

  const candidates = getCandidateUrls(displayUrl)
  let lastStatus = 502

  for (const candidate of candidates) {
    try {
      const res = await fetchWithTimeout(candidate, 8000)
      if (!res.ok) {
        lastStatus = res.status
        continue
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg'
      const body = res.body
      if (!body) {
        lastStatus = 502
        continue
      }

      return new NextResponse(body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      })
    } catch (err) {
      lastStatus = 502
      console.warn('Image proxy candidate failed:', candidate, err)
    }
  }

  return NextResponse.json(
    { error: 'Upstream image failed' },
    { status: lastStatus === 404 ? 404 : 502 }
  )
}
