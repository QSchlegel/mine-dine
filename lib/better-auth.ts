import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin } from "better-auth/plugins"
import { passkey } from "@better-auth/passkey"
import { prisma } from "./prisma"

// Configure passkey plugin
// rpID: Relying Party ID - derived from baseURL (localhost for dev, domain for production)
// rpName: Human-readable name for the relying party
const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const url = new URL(baseURL)
const rpID = url.hostname === 'localhost' ? 'localhost' : url.hostname.replace(/^www\./, '')

// Define roles configuration - must be defined before plugins
// BetterAuth validates adminRoles against this config at initialization
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

// Build plugins array - admin plugin validates against rolesConfig
// Note: adminRoles must exactly match keys in rolesConfig
// Workaround: Only include ADMIN in adminRoles for now
// MODERATOR role exists in rolesConfig but BetterAuth validation has an issue recognizing it
// We'll handle MODERATOR permissions via custom middleware instead
const plugins = [
  admin({
    adminRoles: ["ADMIN"],
  }),
  passkey({
    rpID: rpID,
    rpName: "Mine Dine",
    origin: baseURL.replace(/\/$/, ''), // Remove trailing slash
  }),
]

// Create auth instance with roles defined inline
// BetterAuth validates adminRoles against roles config during initialization
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: baseURL,
  basePath: "/api/auth",
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
  plugins, // Plugins validate against roles config
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
})

export type Session = typeof auth.$Infer.Session
export type User = Session["user"]
