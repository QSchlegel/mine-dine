const PROXY_PATH = '/api/image-proxy?url='

function shouldProxyImageUrl(src: string): boolean {
  if (src.startsWith(PROXY_PATH)) return false
  if (!src.startsWith('https://')) return false

  try {
    const parsed = new URL(src)
    const host = parsed.hostname.toLowerCase()

    if (host === 'storage.railway.app' || host.endsWith('.storage.railway.app')) {
      return true
    }

    // IPFS and Pinata gateways can return 403/timeout for server-side optimizers.
    // Proxying through our own route allows retries and gateway fallbacks.
    if (
      host === 'gateway.pinata.cloud' ||
      host.endsWith('.pinata.cloud') ||
      host === 'ipfs.io' ||
      host === 'cloudflare-ipfs.com' ||
      host === 'w3s.link' ||
      host === 'dweb.link' ||
      host.endsWith('.ipfs.dweb.link')
    ) {
      return true
    }
  } catch {
    return false
  }

  return false
}

/**
 * For private buckets and unstable IPFS gateways, use /api/image-proxy.
 * Other public image URLs are returned unchanged.
 */
export function getProxiedImageUrl(src: string | null | undefined): string | null | undefined {
  if (!src) return src
  if (!shouldProxyImageUrl(src)) return src
  return `${PROXY_PATH}${encodeURIComponent(src)}`
}
