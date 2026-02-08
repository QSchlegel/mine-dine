import { prisma } from './prisma'

/**
 * Check if a user can access an event (view it)
 * A user can access an event if:
 * - They are the host/creator
 * - They have an invitation to the event
 * - They are a moderator or admin
 * - The event is public
 */
export async function canAccessEvent(eventId: string, userId: string | null): Promise<boolean> {
  const dinner = await prisma.dinner.findUnique({
    where: { id: eventId },
    select: {
      hostId: true,
      visibility: true,
      invitations: userId ? {
        where: { userId },
        select: { id: true },
      } : false,
    },
  })

  if (!dinner) return false

  // Public events are accessible to everyone
  if (dinner.visibility === 'PUBLIC') return true

  // Private events require authentication
  if (!userId) return false

  // Host can always access
  if (dinner.hostId === userId) return true

  // Check if user has an invitation
  if (dinner.invitations && dinner.invitations.length > 0) return true

  // Check if user is moderator/admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (user && (user.role === 'MODERATOR' || user.role === 'ADMIN')) return true

  return false
}

/**
 * Check if a user can manage an event (edit, delete, invite guests)
 * Only the host/creator can manage an event
 */
export async function canManageEvent(eventId: string, userId: string): Promise<boolean> {
  const dinner = await prisma.dinner.findUnique({
    where: { id: eventId },
    select: { hostId: true },
  })

  if (!dinner) return false

  return dinner.hostId === userId
}

/**
 * Check if a user has an invitation to an event (by email)
 */
export async function hasInvitationByEmail(eventId: string, email: string): Promise<boolean> {
  const invitation = await prisma.dinnerInvitation.findUnique({
    where: {
      dinnerId_email: {
        dinnerId: eventId,
        email: email.toLowerCase(),
      },
    },
  })

  return !!invitation
}

/**
 * Get invitation status for a user
 */
export async function getInvitationStatus(eventId: string, userId: string): Promise<'PENDING' | 'ACCEPTED' | 'DECLINED' | null> {
  const invitation = await prisma.dinnerInvitation.findFirst({
    where: {
      dinnerId: eventId,
      userId,
    },
    select: { status: true },
  })

  return invitation?.status ?? null
}
