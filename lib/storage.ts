import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  isIpfsConfigured,
  isIpfsUrl,
  uploadBufferToIPFS,
  uploadFileToIPFS,
} from '@/lib/ipfs'

/**
 * Storage utility for file uploads
 * Supports IPFS (Pinata) when PINATA_JWT is set, otherwise AWS S3 / Railway
 */

interface StorageConfig {
  bucketName: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string // For Railway's native bucket
  forcePathStyle?: boolean // For Railway, use virtual-hosted-style (false)
}

function getStorageConfig(): StorageConfig | null {
  // Support both Railway's native bucket variables and standard AWS S3 variables
  const bucketName = process.env.AWS_S3_BUCKET_NAME
  const region = process.env.AWS_DEFAULT_REGION || process.env.AWS_S3_REGION || 'auto'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  // Railway uses AWS_ENDPOINT_URL, but also support AWS_S3_ENDPOINT for compatibility
  const endpoint = process.env.AWS_ENDPOINT_URL || process.env.AWS_S3_ENDPOINT

  if (!bucketName || !accessKeyId || !secretAccessKey) {
    return null
  }

  // Detect Railway's native bucket by endpoint or Railway environment
  const isRailway = endpoint?.includes('storage.railway.app') || 
                    endpoint?.includes('railway.app') ||
                    process.env.RAILWAY_ENVIRONMENT !== undefined

  return {
    bucketName,
    region,
    accessKeyId,
    secretAccessKey,
    endpoint: endpoint || (isRailway ? 'https://storage.railway.app' : undefined),
    // Railway buckets require path-style addressing for presigned URLs
    forcePathStyle: isRailway ? true : undefined,
  }
}

function getS3Client(): S3Client | null {
  const config = getStorageConfig()
  if (!config) {
    return null
  }

  const clientConfig: any = {
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  }

  // Configure for Railway's S3-compatible storage
  if (config.endpoint) {
    clientConfig.endpoint = config.endpoint
    clientConfig.forcePathStyle = config.forcePathStyle ?? false
  }

  return new S3Client(clientConfig)
}

/**
 * Upload a file to storage (IPFS when configured, otherwise S3/Railway).
 * @param file - File to upload
 * @param type - File type category (profile, cover, dinner, grocery-bill)
 * @returns Object with persistent publicUrl and optional signedUrl for immediate use
 */
export async function uploadFile(file: File, type: string): Promise<{ publicUrl: string; signedUrl?: string }> {
  if (isIpfsConfigured()) {
    try {
      const { publicUrl } = await uploadFileToIPFS(file, type)
      return { publicUrl }
    } catch (error) {
      console.error('Error uploading file to IPFS:', error)
      throw new Error('Failed to upload file')
    }
  }

  const client = getS3Client()
  const config = getStorageConfig()

  if (!client || !config) {
    console.warn('Storage not configured, returning placeholder URL')
    const url = `https://placeholder.com/${type}/${file.name}`
    return { publicUrl: url, signedUrl: url }
  }

  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = file.name.split('.').pop() || 'bin'
  const filename = `${type}/${timestamp}-${randomString}.${extension}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const commandConfig: any = {
    Bucket: config.bucketName,
    Key: filename,
    Body: buffer,
    ContentType: file.type || 'application/octet-stream',
    ACL: 'public-read',
  }

  const command = new PutObjectCommand(commandConfig)

  try {
    await client.send(command)

    const publicUrl = buildPublicUrl(filename)
    if (!publicUrl) {
      throw new Error('Failed to build public URL for uploaded file')
    }

    let signedUrl: string | undefined

    if (config.endpoint && config.endpoint.includes('storage.railway.app')) {
      const signed = await getPresignedUrl(filename, 60 * 60 * 24 * 6)
      if (signed) signedUrl = signed
      else console.warn('Presign failed for Railway bucket, falling back to unsigned URL')
    }

    return { publicUrl, signedUrl }
  } catch (error) {
    console.error('Error uploading file to S3:', error)
    throw new Error('Failed to upload file')
  }
}

/**
 * Generate a presigned URL for temporary file access
 * @param key - S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const client = getS3Client()
  const config = getStorageConfig()

  if (!client || !config) {
    return null
  }

  try {
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ResponseContentType: 'image/*',
    })

    const url = await getSignedUrl(client, command, { expiresIn })
    return url
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return null
  }
}

/**
 * Upload a buffer to storage (IPFS when configured, otherwise S3/Railway).
 * @param buffer - Raw file buffer
 * @param type - File type category (e.g. dinner, profile)
 * @param contentType - MIME type (e.g. image/png)
 * @param extension - File extension for the key (e.g. png)
 * @returns Object with persistent publicUrl and optional signedUrl
 */
export async function uploadBuffer(
  buffer: Buffer,
  type: string,
  contentType: string,
  extension: string
): Promise<{ publicUrl: string; signedUrl?: string }> {
  if (isIpfsConfigured()) {
    try {
      const { publicUrl } = await uploadBufferToIPFS(buffer, type, contentType, extension)
      return { publicUrl }
    } catch (error) {
      console.error('Error uploading buffer to IPFS:', error)
      throw new Error('Failed to upload file')
    }
  }

  const client = getS3Client()
  const config = getStorageConfig()

  if (!client || !config) {
    throw new Error('Storage not configured. Set PINATA_JWT for IPFS or AWS_S3_* / Railway bucket env vars.')
  }

  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const filename = `${type}/${timestamp}-${randomString}.${extension}`

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  })

  await client.send(command)

  const publicUrl = buildPublicUrl(filename)
  if (!publicUrl) throw new Error('Failed to build public URL')

  let signedUrl: string | undefined
  if (config.endpoint?.includes('storage.railway.app')) {
    const signed = await getPresignedUrl(filename, 60 * 60 * 24 * 6)
    if (signed) signedUrl = signed
  }

  return { publicUrl, signedUrl }
}

/**
 * Check if storage is configured (IPFS or S3/Railway).
 */
export function isStorageConfigured(): boolean {
  return isIpfsConfigured() || getStorageConfig() !== null
}

/**
 * Extract object key from a public URL generated by this helper.
 * Used to re-sign objects for read access when buckets are private.
 * IPFS URLs have no key (they are already public).
 */
export function extractKeyFromUrl(url: string): string | null {
  if (isIpfsUrl(url)) return null

  try {
    const parsed = new URL(url)
    const config = getStorageConfig()
    const bucket = config?.bucketName

    if (parsed.hostname.includes('storage.railway.app') && bucket && parsed.hostname.startsWith(bucket + '.')) {
      return parsed.pathname.replace(/^\//, '')
    }

    const segments = parsed.pathname.split('/').filter(Boolean)
    if (segments.length >= 2) {
      if (bucket && segments[0] === bucket) {
        return segments.slice(1).join('/')
      }
      return segments.join('/')
    }

    return null
  } catch {
    return null
  }
}

/**
 * Build a public (unsigned) URL for a given object key, respecting current storage config.
 */
export function buildPublicUrl(key: string): string | null {
  const config = getStorageConfig()
  if (!config) return null

  if (config.endpoint) {
    const baseUrl = config.endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (config.forcePathStyle) {
      return `https://${baseUrl}/${config.bucketName}/${key}`
    }
    return `https://${config.bucketName}.${baseUrl}/${key}`
  }

  const region = config.region === 'auto' ? 'us-east-1' : config.region
  return `https://${config.bucketName}.s3.${region}.amazonaws.com/${key}`
}

/**
 * Normalize any signed or public URL back to an unsigned public URL (when possible).
 */
export function normalizeToPublicUrl(url: string): string | null {
  const key = extractKeyFromUrl(url)
  if (!key) return null
  return buildPublicUrl(key)
}

/**
 * Get a signed URL for display if the object lives in a private bucket; otherwise return the original URL.
 * IPFS URLs are returned as-is (already public).
 */
export async function getDisplayImageUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  if (isIpfsUrl(url)) return url

  const key = extractKeyFromUrl(url)
  if (!key) return url

  const signed = await getPresignedUrl(key, 60 * 60 * 24 * 6)
  if (signed) return signed

  return normalizeToPublicUrl(url) || url
}
