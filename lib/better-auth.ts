import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin } from "better-auth/plugins"
import { passkey } from "@better-auth/passkey"
import { createAuthMiddleware } from "better-auth/api"
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
  plugins, // Plugins validate against roles config
  hooks: {
    // Fix role after user creation - Better Auth may create users with lowercase "user"
    // but our Prisma schema expects uppercase enum values (USER, HOST, ADMIN, MODERATOR)
    // Note: This hook runs after user creation, but if Better Auth fails during creation
    // due to role validation, we use the alternative approach in user-creation.ts
    after: createAuthMiddleware(async (ctx) => {
      // Fix role after user creation from any sign-up endpoint
      if (ctx.path.startsWith('/sign-up') && ctx.context.newSession?.user) {
        const userId = ctx.context.newSession.user.id
        
        // Check current role and fix if needed
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })

        // If role is lowercase or invalid, update to uppercase USER
        if (user && user.role !== 'USER' && user.role !== 'HOST' && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
          await prisma.user.update({
            where: { id: userId },
            data: { role: 'USER' },
          })
        }
      }
    }),
    // Hash password before sign-in if account has plain text password
    // This handles cases where we create accounts manually with plain passwords
    // Better Auth expects passwords to be hashed, so we hash the input password
    // and update the stored password before Better Auth processes the sign-in
    before: createAuthMiddleware(async (ctx) => {
      // Intercept sign-in attempts to hash password if account has plain text password
      if (ctx.path === '/sign-in/email' && ctx.body?.password && ctx.body?.email) {
        const email = ctx.body.email.toLowerCase().trim()
        const user = await prisma.user.findUnique({
          where: { email },
          include: { accounts: { where: { providerId: 'credential' } } },
        })
        
        if (user?.accounts[0]?.password) {
          const storedPassword = user.accounts[0].password
          // Check if password is hashed (Better Auth uses scrypt, hashed passwords are longer)
          // Plain text passwords from our UUID generation are ~64 characters
          // Hashed passwords are typically 100+ characters
          if (storedPassword.length < 100) {
            // Password appears to be plain text, hash it using Better Auth's password hasher
            // We hash the input password and store it, then Better Auth will hash the input
            // again and compare - they should match
            const hashedPassword = await ctx.context.password.hash(ctx.body.password)
            await prisma.account.update({
              where: { id: user.accounts[0].id },
              data: { password: hashedPassword },
            })
          }
        }
      }
    }),
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
})

export type Session = typeof auth.$Infer.Session
export type User = Session["user"]
