/**
 * Extract and parse JSON from AI response content.
 * Strips markdown code fences (e.g. ```json ... ```) and trims before parsing.
 */
export function extractAndParseJSON<T>(content: string): T {
  let raw = (content || '{}').trim()

  // Strip markdown code block if present
  const codeBlockStart = raw.indexOf('```')
  if (codeBlockStart === 0) {
    const firstNewline = raw.indexOf('\n')
    if (firstNewline !== -1) {
      raw = raw.slice(firstNewline + 1)
      const closing = raw.indexOf('```')
      if (closing !== -1) {
        raw = raw.slice(0, closing)
      }
    }
  }

  raw = raw.trim()

  // Remove trailing commas before } or ] (invalid in JSON but sometimes returned by models)
  raw = raw.replace(/,(\s*[}\]])/g, '$1')

  return JSON.parse(raw) as T
}
