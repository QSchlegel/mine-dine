import crypto from 'node:crypto'

export function generateInviteToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url')
}

export function hashInviteToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}
