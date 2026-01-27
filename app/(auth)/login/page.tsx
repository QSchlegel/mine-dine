'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/Button'
import { SocialAuthButton } from '@/components/auth/SocialAuthButton'
import { useAuthForm } from '@/hooks/useAuthForm'
import { Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const form = useAuthForm({
    minPasswordLength: 0, // No minimum length for login
    onSubmit: async ({ email, password }) => {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error(`Login failed: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed')
      }

      router.push('/dashboard')
      router.refresh()
    },
  })

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    form.clearErrors()
    try {
      window.location.href = `/api/auth/sign-in/social?provider=${provider}`
    } catch (err) {
      form.setFormError('Failed to initiate social login')
    }
  }

  const handlePasskeyLogin = async () => {
    form.clearErrors()
    try {
      const response = await fetch('/api/auth/passkey/sign-in', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Passkey authentication failed')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to authenticate with passkey'
      form.setFormError(errorMessage)
    }
  }

  return (
    <AuthLayout title="Sign in to your account">
      {/* Error Alert */}
      {(form.errors.form || form.errors.email || form.errors.password) && (
        <AuthAlert 
          message={form.errors.form || form.errors.email || form.errors.password || 'Please check your input'} 
          type="error" 
        />
      )}

      {/* Email/Password Form */}
      <form 
        onSubmit={(e) => {
          console.log('Form submitted', e)
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit(e)
        }} 
        className="space-y-6"
      >
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
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => form.setPassword(e.target.value)}
          error={form.errors.password}
          placeholder="••••••••"
        />

        <Button
          type="submit"
          isLoading={form.isLoading}
          disabled={form.isLoading}
          className="w-full"
          size="lg"
          onClick={async (e) => {
            console.log('Button clicked directly', e)
            e.preventDefault()
            e.stopPropagation()
            // Directly call handleSubmit as fallback
            await form.handleSubmit(e as any)
          }}
        >
          Sign in
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
          onClick={() => handleSocialLogin('google')}
          disabled={form.isLoading}
        />
        <SocialAuthButton
          provider="github"
          onClick={() => handleSocialLogin('github')}
          disabled={form.isLoading}
        />
        <SocialAuthButton
          provider="passkey"
          onClick={handlePasskeyLogin}
          isLoading={form.isLoading}
          disabled={form.isLoading}
        />
      </div>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-[var(--foreground-secondary)]">
        Don't have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-pink-600 hover:text-pink-500 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
