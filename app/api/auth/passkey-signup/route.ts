import { NextRequest, NextResponse } from 'next/server'
import { createUserWithSession } from '@/lib/auth/user-creation'
import { APIError } from 'better-auth/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Use centralized user creation utility
    // This handles role enum mismatch and creates properly signed Better Auth sessions
    const { user, cookies } = await createUserWithSession(
      email,
      name || undefined,
      'USER' // Default role for new users
    )

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: 'Account created. Please register your passkey.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })

    // Set session cookies from Better Auth
    for (const cookie of cookies) {
      response.headers.append('Set-Cookie', cookie)
    }

    return response
  } catch (error) {
    console.error('[Passkey Signup Error]:', error)
    
    // Handle API errors
    if (error instanceof APIError) {
      if (error.message?.toLowerCase().includes('already exists') || 
          error.message?.toLowerCase().includes('email already')) {
        return NextResponse.json(
          { message: 'An account with this email already exists. Please sign in instead.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { message: error.message || 'Failed to create account' },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to create account' },
      { status: 500 }
    )
  }
}
