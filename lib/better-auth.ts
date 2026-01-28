import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin } from "better-auth/plugins"
import { passkey } from "@better-auth/passkey"
import { prisma } from "./prisma"

// Define roles configuration first - must match the roles used in adminRoles
const rolesConfig = {
  USER: {
    permissions: [],
  },
  HOST: {
    permissions: [],
  },
  MODERATOR: {
    permissions: [],
  },
  ADMIN: {
    permissions: [],
  },
} as const

// Build plugins array
const plugins = []

// Add admin plugin - Better Auth validates adminRoles against roles config
// Ensure MODERATOR and ADMIN are defined in rolesConfig above
try {
  plugins.push(
    admin({
      adminRoles: ["ADMIN", "MODERATOR"],
    })
  )
} catch (error) {
  // If admin plugin fails during build, log warning but continue
  // This can happen if Better Auth validates before roles are fully processed
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('Admin plugin configuration warning:', error)
  }
}

// Configure passkey plugin
// rpID: Relying Party ID - derived from baseURL (localhost for dev, domain for production)
// rpName: Human-readable name for the relying party
const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const url = new URL(baseURL)
const rpID = url.hostname === 'localhost' ? 'localhost' : url.hostname.replace(/^www\./, '')

plugins.push(
  passkey({
    rpID: rpID,
    rpName: "Mine Dine",
    origin: baseURL.replace(/\/$/, ''), // Remove trailing slash
  })
)

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  roles: rolesConfig,
  socialProviders: {
    ...(process.env.BETTER_AUTH_GOOGLE_CLIENT_ID && process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET ? {
      google: {
        clientId: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
      },
    } : {}),
    ...(process.env.BETTER_AUTH_GITHUB_CLIENT_ID && process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET ? {
      github: {
        clientId: process.env.BETTER_AUTH_GITHUB_CLIENT_ID,
        clientSecret: process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
      },
    } : {}),
  },
  plugins,
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: baseURL,
  basePath: "/api/auth",
})

export type Session = typeof auth.$Infer.Session
export type User = Session["user"]
