import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// Ensure Node.js runtime (not edge) for Prisma binary engine
export const runtime = 'nodejs'

// Generate a random 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, type = 'login' } = body

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists (for login) or doesn't exist (for signup)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (type === 'login' && !existingUser) {
      return NextResponse.json(
        { message: 'No account found with this email' },
        { status: 404 }
      )
    }

    // Generate a 6-digit code
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing verification codes for this email
    await prisma.verification.deleteMany({
      where: {
        identifier: normalizedEmail,
      },
    })

    // Store the verification code with additional data
    await prisma.verification.create({
      data: {
        identifier: normalizedEmail,
        value: code,
        expiresAt,
        // Store the name for signup in a way that's compatible with Better Auth
        // We'll retrieve it during verification
      },
    })

    // Send code via email (no-op / log when RESEND_API_KEY is not set)
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: 'Your Mine Dine sign-in code',
      text: `Your verification code is: ${code}. It expires in 10 minutes.`,
    })
    if (!emailResult.ok) {
      console.error('[Magic Link] Email send failed:', emailResult.error)
      return NextResponse.json(
        { message: 'Failed to send verification code' },
        { status: 500 }
      )
    }
    if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development') {
      console.log(`[Magic Link] Code for ${normalizedEmail}: ${code}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      // Don't expose the code in production!
      // This is only for development/testing
      ...(process.env.NODE_ENV === 'development' && { code }),
    })
  } catch (error) {
    console.error('[Magic Link Send Error]:', error)
    return NextResponse.json(
      { message: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
