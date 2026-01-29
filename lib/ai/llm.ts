// Unified LLM provider: uses Gemini when GEMINI_API_KEY is set, otherwise OpenAI.

import { generateJSON as generateJSONOpenAI } from './openai'
import { generateJSONWithGemini } from './gemini'

const useGemini = Boolean(process.env.GEMINI_API_KEY)

export async function generateJSON<T>(
  prompt: string,
  schema?: object,
  options?: {
    model?: string
    temperature?: number
  }
): Promise<T> {
  if (useGemini) {
    return generateJSONWithGemini<T>(prompt, schema, options)
  }
  return generateJSONOpenAI<T>(prompt, schema, options)
}
