// Google Gemini API client (via @google/genai)

import { GoogleGenAI } from '@google/genai'
import { extractAndParseJSON } from './parse-json'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  console.warn('GEMINI_API_KEY is not set. Gemini AI features will not work.')
}

export const gemini = apiKey
  ? new GoogleGenAI({ apiKey })
  : null

const DEFAULT_MODEL = 'gemini-2.0-flash'

export async function generateTextWithGemini(
  prompt: string,
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  if (!gemini) {
    throw new Error('Gemini API key is not configured')
  }

  const response = await gemini.models.generateContent({
    model: options?.model || DEFAULT_MODEL,
    contents: prompt,
    config: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 2000,
    },
  })

  return response.text ?? ''
}

export async function generateJSONWithGemini<T>(
  prompt: string,
  schema?: object,
  options?: {
    model?: string
    temperature?: number
  }
): Promise<T> {
  if (!gemini) {
    throw new Error('Gemini API key is not configured')
  }

  const systemInstruction = schema
    ? `You are a helpful assistant that generates JSON responses. Return only valid JSON matching this schema: ${JSON.stringify(schema)}`
    : 'You are a helpful assistant that generates JSON responses. Return only valid JSON, no other text.'

  const response = await gemini.models.generateContent({
    model: options?.model || DEFAULT_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: options?.temperature ?? 0.7,
      responseMimeType: 'application/json',
      ...(schema && { responseSchema: schema as Record<string, unknown> }),
    },
  })

  const content = response.text ?? '{}'
  try {
    return extractAndParseJSON<T>(content)
  } catch (error) {
    console.error('Failed to parse JSON response from Gemini:', content)
    throw new Error('Invalid JSON response from AI')
  }
}
