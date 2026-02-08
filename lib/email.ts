import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom = process.env.EMAIL_FROM ?? 'Mine Dine <onboarding@resend.dev>'

const resend = resendApiKey ? new Resend(resendApiKey) : null

export interface SendEmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
}

/**
 * Send an email via Resend. No-ops (and logs in dev) when RESEND_API_KEY is not set.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Email] (no RESEND_API_KEY) would send to ${to}: ${subject}`)
      if (text) console.log(`[Email] body: ${text}`)
    }
    return { ok: true }
  }

  try {
    const htmlBody = html ?? (text ? escapeHtml(text).replace(/\n/g, '<br>') : '<p></p>')
    const textBody = text ?? (html ? stripHtml(html) : ' ')
    const payload = {
      from: emailFrom,
      to: [to],
      subject,
      html: htmlBody,
      text: textBody,
    }
    const { error } = await resend.emails.send(payload as Parameters<typeof resend.emails.send>[0])
    if (error) {
      console.error('[Email] Resend error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Email] Send failed:', message)
    return { ok: false, error: message }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export interface DinnerInvitationEmailParams {
  to: string
  hostName: string
  dinnerTitle: string
  dinnerDate: string
  inviteUrl: string
  isPrivateEvent?: boolean
  location?: string
  eventId?: string
}

/**
 * Send a dinner invitation email. View event and respond link included.
 */
export async function sendDinnerInvitationEmail(params: DinnerInvitationEmailParams): Promise<{ ok: boolean; error?: string }> {
  const { to, hostName, dinnerTitle, dinnerDate, inviteUrl, isPrivateEvent, location, eventId } = params

  const eventType = isPrivateEvent ? 'a private event' : 'a dinner'
  const subject = `${hostName} invited you to ${dinnerTitle}`

  // Build calendar links if eventId is provided
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const calendarSection = eventId
    ? `\n\nAdd to calendar:\n- Google Calendar: ${baseUrl}/api/events/${eventId}/calendar?format=google\n- Download .ics: ${baseUrl}/api/events/${eventId}/calendar?format=ics`
    : ''

  const text = `${hostName} invited you to ${eventType}: ${dinnerTitle}

Date: ${dinnerDate}${location ? `\nLocation: ${location}` : ''}

View event and RSVP: ${inviteUrl}${calendarSection}`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">You're invited!</h2>
      <p style="color: #666; font-size: 16px;">
        ${escapeHtml(hostName)} invited you to ${eventType}:
      </p>
      <h3 style="color: #333; margin: 16px 0 8px;">${escapeHtml(dinnerTitle)}</h3>
      <p style="color: #666; margin: 4px 0;">
        <strong>When:</strong> ${escapeHtml(dinnerDate)}
      </p>
      ${location ? `<p style="color: #666; margin: 4px 0;"><strong>Where:</strong> ${escapeHtml(location)}</p>` : ''}
      <div style="margin: 24px 0;">
        <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          RSVP Now
        </a>
      </div>
      <p style="color: #999; font-size: 14px;">
        Click the button above to let ${escapeHtml(hostName)} know if you can make it.
      </p>
    </div>
  `

  return sendEmail({ to, subject, text, html })
}

export interface EventRescheduleEmailParams {
  to: string
  hostName: string
  eventTitle: string
  newDate: string
  inviteUrl: string
  location?: string
}

/**
 * Send a reschedule notification email asking guests to re-confirm.
 */
export async function sendEventRescheduleEmail(params: EventRescheduleEmailParams): Promise<{ ok: boolean; error?: string }> {
  const { to, hostName, eventTitle, newDate, inviteUrl, location } = params

  const subject = `Event Rescheduled: ${eventTitle}`

  const text = `${hostName} has rescheduled ${eventTitle}.

New date: ${newDate}${location ? `\nLocation: ${location}` : ''}

Please confirm your attendance: ${inviteUrl}`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Event Rescheduled</h2>
      <p style="color: #666; font-size: 16px;">
        ${escapeHtml(hostName)} has rescheduled <strong>${escapeHtml(eventTitle)}</strong>.
      </p>
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="color: #92400e; margin: 0; font-weight: 600;">
          New date: ${escapeHtml(newDate)}
        </p>
        ${location ? `<p style="color: #92400e; margin: 8px 0 0;">Location: ${escapeHtml(location)}</p>` : ''}
      </div>
      <p style="color: #666;">
        Please confirm if you can still make it:
      </p>
      <div style="margin: 24px 0;">
        <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Confirm Attendance
        </a>
      </div>
    </div>
  `

  return sendEmail({ to, subject, text, html })
}
