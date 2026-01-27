import { prisma } from './prisma'

/**
 * Generate a unique referral code for a moderator
 * Format: MOD-XXXX where XXXX is a random 4-character alphanumeric string
 */
export async function generateReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars like 0, O, I, 1
  let code: string
  let isUnique = false

  do {
    // Generate 4 random characters
    code = 'MOD-'
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    })

    isUnique = !existing
  } while (!isUnique)

  return code
}

/**
 * Assign a referral code to a moderator if they don't have one
 * @param userId - The moderator's user ID
 * @returns The referral code (existing or newly generated)
 */
export async function ensureModeratorReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  if (user.referralCode) {
    return user.referralCode
  }

  // Generate and assign new referral code
  const newCode = await generateReferralCode()
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: newCode },
  })

  return newCode
}

/**
 * Validate a referral code and return the moderator user if valid
 * @param referralCode - The referral code to validate
 * @returns The moderator user or null if invalid
 */
export async function validateReferralCode(referralCode: string) {
  const moderator = await prisma.user.findUnique({
    where: {
      referralCode,
      role: 'MODERATOR',
    },
  })

  return moderator
}
