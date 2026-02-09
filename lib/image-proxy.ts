const PROXY_PATH = '/api/image-proxy?url='
const FALLBACK_IPFS_GATEWAY = 'https://dweb.link'

interface IpfsParts {
  cid: string
  suffix: string
  search: string
}

function isKnownIpfsGatewayHost(host: string): boolean {
  return (
    host === 'gateway.pinata.cloud' ||
    host.endsWith('.pinata.cloud') ||
    host === 'ipfs.io' ||
    host === 'cloudflare-ipfs.com' ||
    host === 'w3s.link' ||
    host === 'dweb.link' ||
    host.endsWith('.ipfs.dweb.link') ||
    host.endsWith('.ipfs.w3s.link')
  )
}

function extractIpfsParts(src: string): IpfsParts | null {
  // Support ipfs://<cid>/<optional-path>
  if (src.startsWith('ipfs://')) {
    const remainder = src.slice('ipfs://'.length)
    const [base, ...rest] = remainder.split('/')
    if (!base) return null
    const suffix = rest.length ? `/${rest.join('/')}` : ''
    return { cid: base, suffix, search: '' }
  }

  try {
    const parsed = new URL(src)
    const host = parsed.hostname.toLowerCase()
    const knownGatewayHost = isKnownIpfsGatewayHost(host)

    // Path-based gateways: /ipfs/<cid>/<optional-path>
    const pathMatch = parsed.pathname.match(/^\/ipfs\/([^/]+)(\/.*)?$/)
    if (pathMatch && knownGatewayHost) {
      return {
        cid: pathMatch[1],
        suffix: pathMatch[2] || '',
        search: parsed.search || '',
      }
    }

    // Subdomain gateways: <cid>.ipfs.<gateway>/<optional-path>
    const parts = host.split('.')
    const ipfsIndex = parts.indexOf('ipfs')
    if (ipfsIndex > 0) {
      const cid = parts[ipfsIndex - 1]
      if (!cid) return null
      return {
        cid,
        suffix: parsed.pathname === '/' ? '' : parsed.pathname,
        search: parsed.search || '',
      }
    }
  } catch {
    return null
  }

  return null
}

function normalizeIpfsUrl(src: string): string {
  const ipfs = extractIpfsParts(src)
  if (!ipfs) return src
  return `${FALLBACK_IPFS_GATEWAY}/ipfs/${ipfs.cid}${ipfs.suffix}${ipfs.search}`
}

function shouldProxyImageUrl(src: string): boolean {
  if (src.startsWith(PROXY_PATH)) return false
  if (!src.startsWith('https://')) return false

  try {
    const parsed = new URL(src)
    const host = parsed.hostname.toLowerCase()

    if (host === 'storage.railway.app' || host.endsWith('.storage.railway.app')) {
      return true
    }
  } catch {
    return false
  }

  return false
}

/**
 * Normalize IPFS URLs to a resilient public gateway and proxy only private storage URLs.
 */
export function getProxiedImageUrl(src: string | null | undefined): string | null | undefined {
  if (!src) return src

  const normalized = normalizeIpfsUrl(src)
  if (!shouldProxyImageUrl(normalized)) return normalized

  return `${PROXY_PATH}${encodeURIComponent(normalized)}`
}
