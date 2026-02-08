import { prisma } from '@/lib/prisma'

export type DinnerAccess =
  | { kind: 'owner' }
  | { kind: 'cohost' }
  | { kind: 'staff' }
  | { kind: 'none' }

export async function getDinnerAccess(userId: string, dinnerId: string): Promise<DinnerAccess> {
  const dinner = await prisma.dinner.findUnique({ where: { id: dinnerId }, select: { hostId: true } })
  if (!dinner) return { kind: 'none' }
  if (dinner.hostId === userId) return { kind: 'owner' }

  const collab = await prisma.dinnerCollaborator.findUnique({
    where: { dinnerId_userId: { dinnerId, userId } },
    select: { role: true },
  })

  if (!collab) return { kind: 'none' }
  if (collab.role === 'OWNER') return { kind: 'owner' }
  if (collab.role === 'COHOST') return { kind: 'cohost' }
  return { kind: 'staff' }
}

export function canEditDinner(access: DinnerAccess) {
  return access.kind === 'owner' || access.kind === 'cohost'
}

export function canAdminDinner(access: DinnerAccess) {
  return access.kind === 'owner'
}
