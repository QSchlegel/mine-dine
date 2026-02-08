#!/usr/bin/env tsx
/**
 * One-time script to promote the user with FIRST_ADMIN_EMAIL to ADMIN role.
 * Use this in production if the first admin was created (e.g. via email/password
 * sign-up) before the first-admin elevation fix was deployed.
 *
 * Requires: FIRST_ADMIN_EMAIL and DATABASE_URL in the environment.
 * Run from project root: npx tsx scripts/promote-first-admin.ts
 * For local runs with .env: node --import tsx --env-file=.env scripts/promote-first-admin.ts
 *   or set vars manually before running.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const firstAdminEmail = process.env.FIRST_ADMIN_EMAIL?.toLowerCase().trim()
  if (!firstAdminEmail) {
    console.error('FIRST_ADMIN_EMAIL is not set. Set it to the email of the user to promote.')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email: firstAdminEmail },
    select: { id: true, email: true, role: true, name: true },
  })

  if (!user) {
    console.error(`No user found with email: ${firstAdminEmail}`)
    process.exit(1)
  }

  if (user.role === 'ADMIN') {
    console.log(`User ${user.email} is already an ADMIN. No change.`)
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
  })

  console.log(`Promoted ${user.email} (${user.name ?? user.id}) to ADMIN.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
