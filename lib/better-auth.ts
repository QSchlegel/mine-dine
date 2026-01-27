import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin } from "better-auth/plugins"
import { prisma } from "./prisma"

// Conditionally import passkey plugin if available
// To enable passkeys, install: npm install @better-auth/passkey
let passkeyPlugin: any = undefined
try {
  const passkeyModule = require("@better-auth/passkey")
  passkeyPlugin = passkeyModule.passkey()
} catch {
  // Passkey plugin not installed, skip
}

const plugins = []

// Only add admin plugin if roles are properly configured
// The admin plugin requires roles to be defined in the roles config
try {
  plugins.push(
    admin({
      adminRoles: ["ADMIN", "MODERATOR"],
    })
  )
} catch (error) {
  console.warn('Admin plugin not configured:', error)
}

if (passkeyPlugin) {
  plugins.push(passkeyPlugin)
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  roles: {
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
  },
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
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  basePath: "/api/auth",
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.User
