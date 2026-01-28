import { UserRole } from '@prisma/client'

/**
 * Type-safe role values matching Prisma UserRole enum
 */
export type SafeUserRole = UserRole

/**
 * Valid role values (uppercase to match Prisma enum)
 */
export const ROLES = {
  USER: 'USER' as const,
  HOST: 'HOST' as const,
  MODERATOR: 'MODERATOR' as const,
  ADMIN: 'ADMIN' as const,
} as const

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(ROLES).includes(role as UserRole)
}

/**
 * Normalize role to uppercase to match Prisma enum
 * Better Auth may use lowercase roles, so we normalize them
 */
export function normalizeRole(role: string): UserRole {
  const upperRole = role.toUpperCase()
  if (isValidRole(upperRole)) {
    return upperRole
  }
  // Default to USER if invalid
  return ROLES.USER
}
