import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'

/**
 * Logout route - uses Better Auth sign-out
 * Better Auth handles the actual sign-out via /api/auth/sign-out
 * This route redirects to the Better Auth sign-out endpoint
 */
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const baseUrl = new URL(request.url)
    // Redirect to Better Auth sign-out endpoint
    const signOutUrl = new URL('/api/auth/sign-out', baseUrl.origin)
    signOutUrl.searchParams.set('redirect', '/login')
    return NextResponse.redirect(signOutUrl)
  } catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, try to redirect to login
    const baseUrl = new URL(request.url)
    return NextResponse.redirect(new URL('/login', baseUrl.origin))
  }
}

// Also support GET for convenience
export async function GET(request: NextRequest) {
  return POST(request)
}
