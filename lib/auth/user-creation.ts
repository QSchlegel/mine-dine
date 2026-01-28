import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/better-auth'
import { headers } from 'next/headers'
import { APIError } from 'better-auth/api'
import type { UserRole } from '@prisma/client'

/**
 * Creates a user with the correct role and a Better Auth session
 * 
 * This utility handles the role enum mismatch between Better Auth (lowercase "user")
 * and our Prisma schema (uppercase "USER"). It creates the user manually with the
 * correct role, then uses Better Auth's signInEmail to create a properly signed session.
 * 
 * @param email - User's email address
 * @param name - User's name (optional)
 * @param role - User role (defaults to 'USER')
 * @returns Object containing the user, session cookies, and response data
 */
export async function createUserWithSession(
  email: string,
  name?: string | null,
  role: UserRole = 'USER'
) {
  const normalizedEmail = email.toLowerCase().trim()

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (existingUser) {
    throw new APIError('BAD_REQUEST', {
      message: 'An account with this email already exists',
    })
  }

  // Create user manually with correct role enum
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name || null,
      emailVerified: true,
      role: role, // Use uppercase enum value
    },
  })

  // Generate a temporary password for Better Auth sign-in
  // This password is only used to create the session - users will authenticate
  // via passkey, magic-link, or other methods going forward
  const tempPassword = crypto.randomUUID() + crypto.randomUUID()

  // Create credential account for Better Auth
  // We'll store the plain password temporarily - Better Auth's before hook
  // will hash it automatically when we attempt to sign in
  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: tempPassword, // Will be hashed by Better Auth's before hook during sign-in
    },
  })

  // Use Better Auth's signInEmail to create a properly signed session
  // The before hook will intercept this and hash the password if needed
  const headersList = await headers()
  const authResponse = await auth.api.signInEmail({
    asResponse: true,
    body: {
      email: normalizedEmail,
      password: tempPassword,
    },
    headers: headersList,
  })
  
  const authData = await authResponse.json()
  const setCookieHeaders = authResponse.headers.getSetCookie()

  return {
    user,
    authData,
    cookies: setCookieHeaders,
  }
}

/**
 * Creates a Better Auth session for an existing user
 * 
 * This is used when a user already exists (e.g., magic-link verification for existing users)
 * and we need to create a session for them.
 * 
 * @param userId - The user's ID
 * @param email - The user's email
 * @returns Object containing session cookies and response data
 */
export async function createSessionForUser(userId: string, email: string) {
  const normalizedEmail = email.toLowerCase().trim()

  // Check if user has a credential account
  let account = await prisma.account.findFirst({
    where: {
      userId: userId,
      providerId: 'credential',
    },
  })

  // Generate a temporary password for Better Auth sign-in
  const tempPassword = crypto.randomUUID() + crypto.randomUUID()

  if (!account) {
    // Create credential account with temporary password
    await prisma.account.create({
      data: {
        userId: userId,
        accountId: userId,
        providerId: 'credential',
        password: tempPassword,
      },
    })
  } else if (!account.password) {
    // Account exists but no password - update it with temp password
    await prisma.account.update({
      where: { id: account.id },
      data: { password: tempPassword },
    })
  }

  // Use Better Auth's signInEmail to create session
  const headersList = await headers()
  const authResponse = await auth.api.signInEmail({
    asResponse: true,
    body: {
      email: normalizedEmail,
      password: tempPassword,
    },
    headers: headersList,
  })

  const authData = await authResponse.json()
  const setCookieHeaders = authResponse.headers.getSetCookie()

  return {
    authData,
    cookies: setCookieHeaders,
  }
}
