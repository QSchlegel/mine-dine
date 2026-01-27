import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from './auth'

/**
 * API route wrapper that requires authentication
 */
export function withAuth(
  handler: (req: NextRequest, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, context?: { params?: { [key: string]: string } }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: { params?: { [key: string]: string } }) => {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(req, user, context)
  }
}

/**
 * API route wrapper that requires specific role
 */
export function withRole(
  requiredRole: 'USER' | 'HOST' | 'MODERATOR' | 'ADMIN',
  handler: (req: NextRequest, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const roleHierarchy = {
      USER: 0,
      HOST: 1,
      MODERATOR: 2,
      ADMIN: 3,
    }

    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] ?? 0
    const requiredRoleLevel = roleHierarchy[requiredRole]

    if (userRoleLevel < requiredRoleLevel) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    return handler(req, user)
  }
}

/**
 * Rate limiting store (in-memory, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple rate limiter middleware
 * @param identifier - Unique identifier for rate limiting (e.g., user ID or IP)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns boolean indicating if request should be allowed
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

/**
 * Clean up old rate limit records
 */
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, value] of entries) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute
