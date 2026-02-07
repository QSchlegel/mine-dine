import { prisma } from '@/lib/prisma'

type AdminActionLogInput = {
  actorId: string
  action: string
  entityType: string
  entityId: string
  decision?: string | null
  note?: string | null
}

export async function logAdminAction(input: AdminActionLogInput) {
  try {
    const adminActionLog = (prisma as any).adminActionLog

    if (!adminActionLog || typeof adminActionLog.create !== 'function') {
      console.warn('AdminActionLog model not available; action log skipped', input)
      return
    }

    await adminActionLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        decision: input.decision ?? null,
        note: input.note ?? null,
      },
    })
  } catch (error) {
    console.warn('Failed to write admin action log; continuing', error)
  }
}
