// OpenAI client wrapper

import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. AI features will not work.')
}

export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

export async function generateText(
  prompt: string,
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured')
  }

  const response = await openai.chat.completions.create({
    model: options?.model || 'gpt-4',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: options?.temperature || 0.7,
    max_tokens: options?.maxTokens || 2000,
  })

  return response.choices[0]?.message?.content || ''
}

export async function generateJSON<T>(
  prompt: string,
  schema?: object,
  options?: {
    model?: string
    temperature?: number
  }
): Promise<T> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured')
  }

  const systemPrompt = schema
    ? `You are a helpful assistant that generates JSON responses. Return only valid JSON matching this schema: ${JSON.stringify(schema)}`
    : 'You are a helpful assistant that generates JSON responses. Return only valid JSON, no other text.'

  const response = await openai.chat.completions.create({
    model: options?.model || 'gpt-4',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: options?.temperature || 0.7,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content || '{}'
  try {
    return JSON.parse(content) as T
  } catch (error) {
    console.error('Failed to parse JSON response:', content)
    throw new Error('Invalid JSON response from AI')
  }
}
