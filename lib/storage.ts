import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Storage utility for file uploads
 * Supports both AWS S3 and Railway's native S3-compatible storage
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
    forcePathStyle: isRailway ? false : undefined, // Virtual-hosted-style for Railway
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
 * Upload a file to S3 storage
 * @param file - File to upload
 * @param type - File type category (profile, cover, dinner, grocery-bill)
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(file: File, type: string): Promise<string> {
  const client = getS3Client()
  const config = getStorageConfig()

  if (!client || !config) {
    // Fallback: return placeholder if storage not configured
    console.warn('Storage not configured, returning placeholder URL')
    return `https://placeholder.com/${type}/${file.name}`
  }

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = file.name.split('.').pop() || 'bin'
  const filename = `${type}/${timestamp}-${randomString}.${extension}`

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload to S3
  const commandConfig: any = {
    Bucket: config.bucketName,
    Key: filename,
    Body: buffer,
    ContentType: file.type || 'application/octet-stream',
  }

  // Try to set ACL for public access (some S3-compatible services may not support this)
  // Railway buckets are typically configured for public access at the bucket level
  if (!config.endpoint || !config.endpoint.includes('railway.app')) {
    commandConfig.ACL = 'public-read'
  }

  const command = new PutObjectCommand(commandConfig)

  try {
    await client.send(command)

    // Generate public URL
    // For Railway: Use the endpoint URL directly with virtual-hosted-style
    // Format: https://bucket-name.storage.railway.app/key
    // For AWS S3: https://bucket-name.s3.region.amazonaws.com/key
    if (config.endpoint && config.endpoint.includes('storage.railway.app')) {
      // Railway virtual-hosted-style URL
      // Extract base domain from endpoint if needed, or use standard format
      const baseUrl = config.endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '')
      // Railway uses: bucket-name.storage.railway.app
      return `https://${config.bucketName}.storage.railway.app/${filename}`
    } else if (config.endpoint) {
      // Custom S3-compatible endpoint (path-style)
      const baseUrl = config.endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '')
      return `https://${baseUrl}/${config.bucketName}/${filename}`
    } else {
      // Standard AWS S3 URL
      const region = config.region === 'auto' ? 'us-east-1' : config.region
      return `https://${config.bucketName}.s3.${region}.amazonaws.com/${filename}`
    }
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
    })

    const url = await getSignedUrl(client, command, { expiresIn })
    return url
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return null
  }
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
  return getStorageConfig() !== null
}
