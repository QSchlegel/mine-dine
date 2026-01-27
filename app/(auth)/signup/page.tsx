'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/Button'
import { SocialAuthButton } from '@/components/auth/SocialAuthButton'
import { useAuthForm } from '@/hooks/useAuthForm'
import { Mail, User } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'good' | 'strong' | 'none'>('none')
  
  const form = useAuthForm({
    minPasswordLength: 8, // Require 8 characters for signup
    onSubmit: async ({ email, password, name }) => {
      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
        }),
      })

      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error(`Sign up failed: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Sign up failed')
      }

      router.push('/dashboard')
      router.refresh()
    },
  })

  const handleSocialSignup = async (provider: 'google' | 'github') => {
    form.clearErrors()
    try {
      window.location.href = `/api/auth/sign-in/social?provider=${provider}`
    } catch (err) {
      form.setFormError('Failed to initiate social sign up')
    }
  }

  const handlePasskeySignup = async () => {
    form.clearErrors()
    if (!form.email) {
      form.setFormError('Please enter your email first to register a passkey')
      return
    }

    try {
      const response = await fetch('/api/auth/passkey/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          name: form.name || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Passkey registration failed')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register passkey'
      form.setFormError(errorMessage)
    }
  }

  return (
    <AuthLayout title="Create your account">
      {/* Error Alert */}
      {form.errors.form && (
        <AuthAlert message={form.errors.form} type="error" />
      )}

      {/* Email/Password Form */}
      <form onSubmit={form.handleSubmit} className="space-y-6">
        <Input
          label="Name (optional)"
          type="text"
          autoComplete="name"
          value={form.name || ''}
          onChange={(e) => form.setName(e.target.value)}
          error={form.errors.name}
          placeholder="John Doe"
          leftIcon={<User className="h-5 w-5" />}
        />

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => form.setEmail(e.target.value)}
          error={form.errors.email}
          placeholder="you@example.com"
          leftIcon={<Mail className="h-5 w-5" />}
        />

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) => form.setPassword(e.target.value)}
          error={form.errors.password}
          placeholder="••••••••"
          showStrengthIndicator={true}
          onStrengthChange={setPasswordStrength}
        />

        <PasswordInput
          label="Confirm Password"
          autoComplete="new-password"
          required
          value={form.confirmPassword || ''}
          onChange={(e) => form.setConfirmPassword(e.target.value, form.password)}
          error={form.errors.confirmPassword}
          placeholder="••••••••"
          showStrengthIndicator={false}
        />

        <Button
          type="submit"
          isLoading={form.isLoading}
          className="w-full"
          size="lg"
        >
          Sign up
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[var(--background-elevated)] text-[var(--foreground-secondary)]">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Auth Buttons */}
      <div className="space-y-3">
        <SocialAuthButton
          provider="google"
          onClick={() => handleSocialSignup('google')}
          disabled={form.isLoading}
        />
        <SocialAuthButton
          provider="github"
          onClick={() => handleSocialSignup('github')}
          disabled={form.isLoading}
        />
        <SocialAuthButton
          provider="passkey"
          onClick={handlePasskeySignup}
          isLoading={form.isLoading}
          disabled={form.isLoading || !form.email}
        />
      </div>

      {/* Sign In Link */}
      <p className="text-center text-sm text-[var(--foreground-secondary)]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-pink-600 hover:text-pink-500 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
