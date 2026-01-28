'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/Button'
import { authClient } from '@/lib/auth-client'
import { useConfetti } from '@/hooks/useConfetti'
import {
  Mail,
  Fingerprint,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  CheckCircle2,
  Smartphone,
  Loader2
} from 'lucide-react'

type AuthStep = 'email' | 'method' | 'password' | 'magic-link-sent' | 'creating-account' | 'registering-passkey'

export default function SignupPage() {
  const router = useRouter()
  const { fireSuccess, fireEmoji } = useConfetti()
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkCode, setMagicLinkCode] = useState('')

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

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

  const handlePasskeySignup = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    setStep('creating-account')

    try {
      // Step 1: Create the user account and session via custom endpoint
      const createResponse = await fetch('/api/auth/passkey-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
        credentials: 'include', // Important: include cookies
      })

      const createData = await createResponse.json()

      if (!createResponse.ok) {
        if (createData.message?.toLowerCase().includes('already exists')) {
          setError('An account with this email already exists. Please sign in instead.')
          setStep('method')
          return
        }
        throw new Error(createData.message || 'Failed to create account')
      }

      // Step 2: Show loading animation before passkey modal
      setStep('registering-passkey')
      
      // Small delay to show the loading animation
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 3: Now that we have a session, add the passkey
      // passkey.addPasskey() will require creating a NEW passkey (not selecting existing ones)
      const passkeyResult = await authClient.passkey.addPasskey({
        name: name || email,
      })

      if (passkeyResult.error) {
        throw new Error(passkeyResult.error.message || 'Failed to register passkey')
      }

      // Step 4: Celebrate with confetti!
      fireSuccess()
      setTimeout(() => fireEmoji('🎉'), 200)
      setTimeout(() => fireEmoji('✨'), 400)

      // Small delay to let confetti play
      await new Promise(resolve => setTimeout(resolve, 800))

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register passkey')
      setStep('method')
    } finally {
      setIsLoading(false)
    }
  }, [email, name, router, fireSuccess, fireEmoji])

  const handleMagicLinkRequest = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/magic-link/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined, type: 'signup' }),
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
  }, [email, name])

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

  const handlePasswordSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Sign up failed')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setIsLoading(false)
    }
  }, [email, password, confirmPassword, name, router])

  const goBack = () => {
    setError(null)
    if (step === 'method' || step === 'password') {
      setStep('email')
    } else if (step === 'magic-link-sent') {
      setStep('method')
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join Mine Dine and discover amazing dining experiences">
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

              <Input
                label="Name (optional)"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />

              <Button type="submit" className="w-full" size="lg">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="text-center text-sm text-[var(--foreground-secondary)] mt-6">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-coral-500 hover:text-coral-400 transition-colors">
                Sign in
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
              {/* Passkey - Recommended */}
              <motion.button
                type="button"
                onClick={handlePasskeySignup}
                disabled={isLoading}
                className="w-full p-4 rounded-xl border-2 border-coral-500 bg-coral-500/5 hover:bg-coral-500/10 transition-all text-left group relative overflow-hidden"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-coral-500 text-white rounded-full">
                    Recommended
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-coral-500/20 text-coral-500">
                    <Fingerprint className="h-6 w-6" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-[var(--foreground)] mb-1">
                      Set up Passkey
                    </h3>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      Use Face ID, Touch ID, or fingerprint for instant, secure sign-in
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
                      Email me a sign-in link
                    </h3>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      We&apos;ll send a magic link to your email - no password needed
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
                      Create a password
                    </h3>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      Traditional sign-in with email and password
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

        {/* Step 3a: Password Setup */}
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

            <form onSubmit={handlePasswordSignup} className="space-y-6">
              <PasswordInput
                label="Create password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                showStrengthIndicator={true}
              />

              <PasswordInput
                label="Confirm password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />

              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                Create account
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

        {/* Creating Account Loading State */}
        {step === 'creating-account' && (
          <motion.div
            key="creating-account"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-16 space-y-6"
          >
            <motion.div
              className="relative"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-16 h-16 rounded-full border-4 border-coral-500/20 border-t-coral-500" />
            </motion.div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-[var(--foreground)]">
                Creating your account
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                Setting everything up for you...
              </p>
            </div>
          </motion.div>
        )}

        {/* Registering Passkey Loading State */}
        {step === 'registering-passkey' && (
          <motion.div
            key="registering-passkey"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-16 space-y-6"
          >
            <motion.div
              className="relative"
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: [0.8, 1, 0.8],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div className="p-4 rounded-2xl bg-coral-500/10 border-2 border-coral-500/30">
                <Fingerprint className="h-12 w-12 text-coral-500" />
              </div>
            </motion.div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-[var(--foreground)]">
                Ready to set up your passkey
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                A security prompt will appear in a moment...
              </p>
            </div>
            <motion.div
              className="flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-coral-500"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
