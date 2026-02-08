/**
 * For private storage URLs (e.g. Railway), use the image-proxy so they work in prod.
 * Public URLs (IPFS, Unsplash, etc.) are returned unchanged.
 */
export function getProxiedImageUrl(src: string | null | undefined): string | null | undefined {
  if (!src) return src
  if (src.includes('storage.railway.app')) {
    return `/api/image-proxy?url=${encodeURIComponent(src)}`
  }
  return src
}
