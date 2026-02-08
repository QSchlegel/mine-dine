import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
// Resend expects "Name <email@domain.com>" with no literal quotes in the string; strip any that slipped in from env
const rawFrom = process.env.EMAIL_FROM ?? 'Mine Dine <onboarding@resend.dev>'
const emailFrom = rawFrom.startsWith('"') && rawFrom.endsWith('"') ? rawFrom.slice(1, -1) : rawFrom

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

/** Wrap body HTML in full document with MineDine brand font (Plus Jakarta Sans) for email clients that support it. */
function wrapEmailDocument(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 24px 0; background: linear-gradient(180deg, #F8F5F2 0%, #F0ECE8 100%);">
  ${body}
</body>
</html>`
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

  // MineDine brand: landing-style — gradient mesh, pink gradient CTA, warm cream #FFFCFA, teal accent #0D9488, coral/rose gradient
  const html = `
    <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <!-- Outer card with subtle gradient and shadow (landing-style) -->
      <div style="background: linear-gradient(145deg, #FFFCFA 0%, #F8F5F2 50%, #F0ECE8 100%); border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(26, 22, 20, 0.08), 0 12px 28px rgba(26, 22, 20, 0.06); border: 1px solid rgba(26, 22, 20, 0.06);">
        <p style="color: #0D9488; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; margin: 0 0 24px;">Mine Dine</p>
        <h2 style="color: #1A1614; font-size: 28px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em;">You're invited!</h2>
        <p style="color: #5C524A; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          ${escapeHtml(hostName)} invited you to ${eventType}:
        </p>
        <div style="background: rgba(255,255,255,0.7); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(26, 22, 20, 0.06);">
          <h3 style="color: #1A1614; font-size: 22px; font-weight: 700; margin: 0 0 12px;">${escapeHtml(dinnerTitle)}</h3>
          <p style="color: #5C524A; font-size: 15px; margin: 4px 0;">
            <strong style="color: #1A1614;">When:</strong> ${escapeHtml(dinnerDate)}
          </p>
          ${location ? `<p style="color: #5C524A; font-size: 15px; margin: 4px 0;"><strong style="color: #1A1614;">Where:</strong> ${escapeHtml(location)}</p>` : ''}
        </div>
        <div style="margin: 32px 0 24px;">
          <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4); border: 1px solid rgba(255,255,255,0.2);">
            RSVP Now
          </a>
        </div>
        <p style="color: #8C8078; font-size: 14px; line-height: 1.5;">
          Click the button above to let ${escapeHtml(hostName)} know if you can make it.
        </p>
      </div>
    </div>
  `

  return sendEmail({ to, subject, text, html: wrapEmailDocument(html) })
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

  // MineDine brand: same palette; CTA uses primary coral; reschedule box uses brand amber
  const html = `
    <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFFCFA; padding: 32px 24px; border-radius: 12px;">
      <p style="color: #0D9488; font-size: 13px; font-weight: 600; letter-spacing: 0.02em; margin: 0 0 20px;">Mine Dine</p>
      <h2 style="color: #1A1614; font-size: 24px; font-weight: 700; margin: 0 0 8px;">Event Rescheduled</h2>
      <p style="color: #5C524A; font-size: 16px; line-height: 1.5; margin: 0 0 16px;">
        ${escapeHtml(hostName)} has rescheduled <strong style="color: #1A1614;">${escapeHtml(eventTitle)}</strong>.
      </p>
      <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="color: #92400e; margin: 0; font-weight: 600; font-size: 15px;">
          New date: ${escapeHtml(newDate)}
        </p>
        ${location ? `<p style="color: #92400e; margin: 8px 0 0; font-size: 15px;">Location: ${escapeHtml(location)}</p>` : ''}
      </div>
      <p style="color: #5C524A; font-size: 16px;">
        Please confirm if you can still make it:
      </p>
      <div style="margin: 24px 0;">
        <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; background-color: #E85D75; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Confirm Attendance
        </a>
      </div>
    </div>
  `

  return sendEmail({ to, subject, text, html: wrapEmailDocument(html) })
}
