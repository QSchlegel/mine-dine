import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'

/**
 * Upload file (images, grocery bills)
 * POST /api/uploads
 */
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'profile', 'cover', 'dinner', 'grocery-bill'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // In production, upload to Cloudinary or AWS S3
    // For now, return a placeholder URL
    const uploadUrl = await uploadFile(file, type)

    return NextResponse.json({ url: uploadUrl })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
})

async function uploadFile(file: File, type: string): Promise<string> {
  // Placeholder implementation
  // In production, implement Cloudinary or AWS S3 upload
  return `https://placeholder.com/${type}/${file.name}`
}
