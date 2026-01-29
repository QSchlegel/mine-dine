import { Blob } from 'buffer'

export interface PinResult {
  cid: string
  url: string
}

const DEFAULT_GATEWAY_BASE = 'https://gateway.pinata.cloud'

function getGatewayBase(): string {
  return DEFAULT_GATEWAY_BASE
}

function getPinataJwt(): string | null {
  const jwt = process.env.PINATA_JWT
  return jwt && jwt.trim() ? jwt.trim() : null
}

/**
 * Whether IPFS (Pinata) is configured for storage.
 */
export function isIpfsConfigured(): boolean {
  return getPinataJwt() !== null
}

const PINATA_V3_UPLOAD_URL = 'https://uploads.pinata.cloud/v3/files'

/**
 * Pin a file (as FormData) to IPFS via Pinata v3 API. Returns gateway URL.
 */
async function pinFileToIPFS(
  file: Blob | Buffer | File,
  filename: string,
  contentType?: string
): Promise<{ publicUrl: string }> {
  const pinataJwt = getPinataJwt()
  if (!pinataJwt) {
    throw new Error('IPFS not configured. Set PINATA_JWT to use IPFS storage.')
  }

  const form = new FormData()
  type FormDataValue = Blob | Buffer | File
  const appendFile = form.append.bind(form) as (name: string, value: FormDataValue, filename?: string) => void
  if (file instanceof Buffer) {
    const blob = new Blob([new Uint8Array(file)], {
      type: contentType || 'application/octet-stream',
    })
    appendFile('file', blob, filename)
  } else {
    appendFile('file', file, filename)
  }
  form.append('network', 'public')
  form.append('name', filename)

  const res = await fetch(PINATA_V3_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pinata pin failed: ${res.status} ${text}`)
  }

  const json = await res.json()
  const cid = json?.data?.cid
  if (!cid) throw new Error('Pinata v3 response missing data.cid')

  const gatewayBase = getGatewayBase()
  const publicUrl = `${gatewayBase}/ipfs/${cid}`

  return { publicUrl }
}

/**
 * Upload a buffer to IPFS (e.g. generated images).
 */
export async function uploadBufferToIPFS(
  buffer: Buffer,
  type: string,
  contentType: string,
  extension: string
): Promise<{ publicUrl: string }> {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const filename = `${type}/${timestamp}-${randomString}.${extension}`
  return pinFileToIPFS(buffer, filename, contentType)
}

/**
 * Upload a File to IPFS (e.g. user-uploaded profile or dinner images).
 */
export async function uploadFileToIPFS(
  file: File,
  type: string
): Promise<{ publicUrl: string }> {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const ext = file.name.split('.').pop() || 'bin'
  const filename = `${type}/${timestamp}-${randomString}.${ext}`
  return pinFileToIPFS(file, filename, file.type || undefined)
}

/**
 * Return true if the URL is an IPFS gateway URL (no signing needed).
 */
export function isIpfsUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    const u = new URL(url)
    return (
      u.pathname.includes('/ipfs/') ||
      u.hostname.includes('pinata.cloud') ||
      u.hostname.includes('ipfs.io') ||
      u.hostname.endsWith('.ipfs.dweb.link')
    )
  } catch {
    return false
  }
}

/**
 * Pin a markdown string to IPFS via Pinata v3 API.
 * Requires PINATA_JWT in environment.
 */
export async function pinMarkdownToIPFS(
  filename: string,
  markdown: string
): Promise<PinResult | null> {
  const pinataJwt = getPinataJwt()
  if (!pinataJwt) return null

  const form = new FormData()
  const appendFile = form.append.bind(form) as (name: string, value: Blob | Buffer | File, filename?: string) => void
  appendFile('file', new Blob([markdown], { type: 'text/markdown' }), filename)
  form.append('network', 'public')
  form.append('name', filename)

  const res = await fetch(PINATA_V3_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pinata pin failed: ${res.status} ${text}`)
  }

  const json = await res.json()
  const cid = json?.data?.cid
  if (!cid) throw new Error('Pinata v3 response missing data.cid')

  const gatewayBase = getGatewayBase()
  return {
    cid,
    url: `${gatewayBase}/ipfs/${cid}`,
  }
}
