import { openai } from '@/lib/ai/openai'

type ModerationResult = {
  safe: boolean
  reasons: string[]
}

/**
 * Run Safe-for-Work moderation on an uploaded image.
 * Uses OpenAI omni moderation. Falls back to allow images when the API
 * key is not configured (existing behavior is preserved, but a warning is logged).
 */
export async function ensureImageIsSafe(file: File): Promise<ModerationResult> {
  if (!openai) {
    console.warn('OPENAI_API_KEY missing. Skipping image moderation check.')
    return { safe: true, reasons: ['moderation_not_configured'] }
  }

  // Convert to base64 data URL for moderation API
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type || 'application/octet-stream'
  const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`

  try {
    const response = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: [
        {
          type: 'image_url',
          image_url: {
            url: dataUrl,
          },
        },
      ],
    })

    const firstResult = response.results?.[0]
    const flagged = firstResult?.flagged ?? false
    const categories = firstResult?.categories ?? {}

    const reasons = Object.entries(categories)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key.replace(/_/g, ' '))

    return { safe: !flagged, reasons }
  } catch (error) {
    console.error('Image moderation failed:', error)
    // Fail closed to be safe: treat errors as unsafe
    return {
      safe: false,
      reasons: ['moderation_error'],
    }
  }
}
