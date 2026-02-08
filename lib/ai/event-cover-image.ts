/**
 * Generate an event/dinner party cover image using OpenAI DALL-E.
 * Image is uploaded to app storage and returns a permanent URL.
 */

import { openai } from './openai'
import { uploadBuffer } from '@/lib/storage'

export interface GenerateEventCoverParams {
  title: string
  description?: string
}

function buildEventCoverPrompt(params: GenerateEventCoverParams): string {
  const { title, description } = params
  const parts = [
    'Warm, inviting photograph of a dinner party or social gathering.',
    `Theme or occasion: ${title}.`,
    'Cozy atmosphere, good lighting, diverse group of friends around a table, appetizing food, welcoming mood. Safe for work, no text in image.',
  ]
  if (description && description.length > 0) {
    parts.push(`Details: ${description.slice(0, 200)}`)
  }
  return parts.join(' ')
}

/**
 * Generate one cover image for an event using DALL-E. Uploads to storage and returns the permanent URL.
 */
export async function generateEventCoverImage(
  params: GenerateEventCoverParams
): Promise<string | null> {
  if (!openai) {
    console.warn('OPENAI_API_KEY is not set. Event cover image generation will not work.')
    return null
  }

  const prompt = buildEventCoverPrompt(params)

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024', // landscape for cover
    quality: 'standard',
    response_format: 'b64_json',
  })

  const image = response.data?.[0]
  const b64 = image?.b64_json
  if (!b64) {
    throw new Error('OpenAI did not return image data')
  }

  const buffer = Buffer.from(b64, 'base64')
  const { publicUrl } = await uploadBuffer(buffer, 'dinner', 'image/png', 'png')
  return publicUrl
}
