import { auth } from './better-auth'
import { prisma } from './prisma'
import { headers } from 'next/headers'

/**
 * Get the current authenticated user from Better Auth session
 * @returns Promise resolving to the user or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session?.user) {
      return null
    }

    // Get full user data from database including relations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Require authentication - throws error if user is not authenticated
 * @returns Promise resolving to the authenticated user
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Check if user has required role
 * @param user - The user object
 * @param requiredRole - The required role
 * @returns boolean indicating if user has the required role
 */
export function hasRole(user: { role: string } | null, requiredRole: 'USER' | 'HOST' | 'MODERATOR' | 'ADMIN') {
  if (!user) return false

  const roleHierarchy = {
    USER: 0,
    HOST: 1,
    MODERATOR: 2,
    ADMIN: 3,
  }

  return roleHierarchy[user.role as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole]
}

/**
 * Require specific role - throws error if user doesn't have required role
 * @param requiredRole - The required role
 * @returns Promise resolving to the authenticated user with required role
 */
export async function requireRole(requiredRole: 'USER' | 'HOST' | 'MODERATOR' | 'ADMIN') {
  const user = await requireAuth()

  if (!hasRole(user, requiredRole)) {
    throw new Error(`Forbidden: ${requiredRole} role required`)
  }

  return user
}
