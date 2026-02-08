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
}

/**
 * Send a dinner invitation email. View event and respond link included.
 */
export async function sendDinnerInvitationEmail(params: DinnerInvitationEmailParams): Promise<{ ok: boolean; error?: string }> {
  const { to, hostName, dinnerTitle, dinnerDate, inviteUrl } = params
  const subject = `${hostName} invited you to ${dinnerTitle}`
  const text = `${hostName} invited you to ${dinnerTitle} – ${dinnerDate}.\n\nView event and respond: ${inviteUrl}`
  const html = `<p>${escapeHtml(hostName)} invited you to <strong>${escapeHtml(dinnerTitle)}</strong> – ${escapeHtml(dinnerDate)}.</p><p><a href="${escapeHtml(inviteUrl)}">View event and respond</a></p>`
  return sendEmail({ to, subject, text, html })
}
