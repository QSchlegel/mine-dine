import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { uploadFile } from '@/lib/storage'
import { ensureImageIsSafe } from '@/lib/moderation'

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

    // Validate file type
    const allowedTypes = ['profile', 'cover', 'dinner', 'grocery-bill']
    if (!type || !allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Validate file type (images only)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed' },
        { status: 400 }
      )
    }

    if (['profile', 'cover'].includes(type)) {
      const moderation = await ensureImageIsSafe(file)
      if (!moderation.safe) {
        return NextResponse.json(
          {
            error: 'Image failed the safety check. Please choose a different photo.',
            reasons: moderation.reasons,
          },
          { status: 400 }
        )
      }
    }

    const { publicUrl, signedUrl } = await uploadFile(file, type)

    return NextResponse.json({ url: publicUrl, signedUrl })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
})
