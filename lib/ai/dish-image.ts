/**
 * Generate a plated-dish image using OpenAI DALL-E.
 * Image is uploaded to app storage so the recipe gets a permanent URL.
 */

import { openai } from './openai'
import { uploadBuffer } from '@/lib/storage'

export interface GenerateDishImageParams {
  title: string
  description?: string
  /** Optional context e.g. "Italian", "4 servings" */
  context?: string
}

/**
 * Build a prompt for food photography: final dish plated professionally.
 */
function buildDishPrompt(params: GenerateDishImageParams): string {
  const { title, description, context } = params
  const parts = [
    'Professional food photograph of',
    title,
    'plated on a white plate, restaurant-style presentation, appetizing, high-quality food photography, natural lighting.',
  ]
  if (description) {
    parts.push('Dish style:', description)
  }
  if (context) {
    parts.push(context)
  }
  return parts.join(' ')
}

/**
 * Generate one image of the final dish using DALL-E. Uploads to storage and returns the permanent URL.
 */
export async function generateDishImage(params: GenerateDishImageParams): Promise<string | null> {
  if (!openai) {
    console.warn('OPENAI_API_KEY is not set. Dish image generation will not work.')
    return null
  }

  const prompt = buildDishPrompt(params)

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
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
