'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/Button'
import { authClient } from '@/lib/auth-client'
import {
  Mail,
  Fingerprint,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  CheckCircle2,
  Smartphone
} from 'lucide-react'

type AuthStep = 'email' | 'method' | 'password' | 'magic-link-sent'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkCode, setMagicLinkCode] = useState('')
  const [isCheckingPasskeys, setIsCheckingPasskeys] = useState(true)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Attempt passkey authentication on component mount
  useEffect(() => {
    const attemptPasskeyLogin = async () => {
      try {
        const result = await authClient.signIn.passkey()

        if (!result.error) {
          // Passkey authentication successful
          router.push('/dashboard')
          router.refresh()
          return
        }
      } catch (err) {
        // Silently fail - no passkeys available or user cancelled
        // This is expected behavior, so we don't show an error
      } finally {
        setIsCheckingPasskeys(false)
      }
    }

    attemptPasskeyLogin()
  }, [router])

  const handleEmailContinue = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('Please enter your email')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setStep('method')
  }, [email])

  const handlePasskeyLogin = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await authClient.signIn.passkey()

      if (result.error) {
        throw new Error(result.error.message || 'Passkey authentication failed')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate with passkey')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const handleMagicLinkRequest = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/magic-link/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'login' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send magic link')
      }

      setStep('magic-link-sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }, [email])

  const handleMagicLinkVerify = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/magic-link/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: magicLinkCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Invalid code')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }, [email, magicLinkCode, router])

  const handlePasswordLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password) {
      setError('Please enter your password')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }, [email, password, router])

  const goBack = () => {
    setError(null)
    if (step === 'method' || step === 'password') {
      setStep('email')
    } else if (step === 'magic-link-sent') {
      setStep('method')
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to Mine Dine">
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AuthAlert message={error} type="error" />
          </motion.div>
        )}
      </AnimatePresence>

      {isCheckingPasskeys ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-coral-500 border-t-transparent rounded-full" />
          <p className="text-sm text-[var(--foreground-secondary)]">
            Checking for passkeys...
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
        {/* Step 1: Email Input */}
        {step === 'email' && (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleEmailContinue} className="space-y-6">
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                leftIcon={<Mail className="h-5 w-5" />}
              />

              <Button type="submit" className="w-full" size="lg">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="text-center text-sm text-[var(--foreground-secondary)] mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-coral-500 hover:text-coral-400 transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>
        )}

        {/* Step 2: Choose Method */}
        {step === 'method' && (
          <motion.div
            key="method-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Email confirmation */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
              <div className="p-2 rounded-full bg-coral-500/10">
                <Mail className="h-4 w-4 text-coral-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">{email}</p>
                <button
                  type="button"
                  onClick={goBack}
                  className="text-xs text-coral-500 hover:text-coral-400 transition-colors"
                >
                  Change email
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Passkey - Primary */}
              <motion.button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={isLoading}
                className="w-full p-4 rounded-xl border-2 border-coral-500 bg-coral-500/5 hover:bg-coral-500/10 transition-all text-left group relative overflow-hidden"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-coral-500 text-white rounded-full">
                    Fastest
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-coral-500/20 text-coral-500">
                    <Fingerprint className="h-6 w-6" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-[var(--foreground)] mb-1">
                      Sign in with Passkey
                    </h3>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      Use Face ID, Touch ID, or fingerprint to sign in instantly
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Magic Link */}
              <motion.button
                type="button"
                onClick={handleMagicLinkRequest}
                disabled={isLoading}
                className="w-full p-4 rounded-xl border border-[var(--border)] hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--foreground)] mb-1">
                      Email me a sign-in code
                    </h3>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      We&apos;ll send a code to your email - no password needed
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Password */}
              <motion.button
                type="button"
                onClick={() => setStep('password')}
                disabled={isLoading}
                className="w-full p-4 rounded-xl border border-[var(--border)] hover:border-[var(--foreground-secondary)]/30 hover:bg-[var(--background-secondary)] transition-all text-left"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[var(--background-secondary)] text-[var(--foreground-secondary)]">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--foreground)] mb-1">
                      Use password
                    </h3>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      Sign in with your email and password
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-coral-500 border-t-transparent rounded-full" />
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3a: Password Login */}
        {step === 'password' && (
          <motion.div
            key="password-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to options
            </button>

            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <PasswordInput
                label="Password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/forgot-password"
                  className="text-coral-500 hover:text-coral-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                Sign in
              </Button>
            </form>
          </motion.div>
        )}

        {/* Step 3b: Magic Link Sent */}
        {step === 'magic-link-sent' && (
          <motion.div
            key="magic-link-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <motion.div
                className="p-4 rounded-full bg-cyan-500/10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Smartphone className="h-12 w-12 text-cyan-500" />
              </motion.div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                Check your email
              </h3>
              <p className="text-[var(--foreground-secondary)]">
                We sent a 6-digit code to <span className="font-medium text-[var(--foreground)]">{email}</span>
              </p>
            </div>

            <form onSubmit={handleMagicLinkVerify} className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                value={magicLinkCode}
                onChange={(e) => setMagicLinkCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />

              <Button
                type="submit"
                isLoading={isLoading}
                disabled={magicLinkCode.length !== 6}
                className="w-full"
                size="lg"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Verify code
              </Button>
            </form>

            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                type="button"
                onClick={handleMagicLinkRequest}
                disabled={isLoading}
                className="text-coral-500 hover:text-coral-400 transition-colors"
              >
                Resend code
              </button>
              <span className="text-[var(--border)]">•</span>
              <button
                type="button"
                onClick={goBack}
                className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                Try another method
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      )}
    </AuthLayout>
  )
}
