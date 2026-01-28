import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUserWithSession, createSessionForUser } from '@/lib/auth/user-creation'
import { APIError } from 'better-auth/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email and code are required' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Find the verification record
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: normalizedEmail,
        value: code,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!verification) {
      return NextResponse.json(
        { message: 'Invalid or expired code' },
        { status: 400 }
      )
    }

    // Delete the verification record (single use)
    await prisma.verification.delete({
      where: { id: verification.id },
    })

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    let user: { id: string; email: string | null; name: string | null }
    let cookies: string[]

    if (!existingUser) {
      // Create new user using centralized utility
      // This handles role enum mismatch and creates properly signed Better Auth sessions
      const result = await createUserWithSession(
        normalizedEmail,
        undefined, // No name from magic-link
        'USER' // Default role for new users
      )

      user = result.user
      cookies = result.cookies

      // Create a profile for the new user
      await prisma.profile.create({
        data: {
          userId: user.id,
        },
      })
    } else {
      // For existing users, create a session using the utility
      const result = await createSessionForUser(existingUser.id, normalizedEmail)

      user = existingUser
      cookies = result.cookies

      // Mark email as verified if not already
      if (!existingUser.emailVerified) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerified: true },
        })
      }
    }

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: 'Successfully signed in',
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
    console.error('[Magic Link Verify Error]:', error)
    
    // Handle API errors
    if (error instanceof APIError) {
      return NextResponse.json(
        { message: error.message || 'Verification failed' },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { message: 'Verification failed' },
      { status: 500 }
    )
  }
}
