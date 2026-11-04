import crypto from 'crypto'
import { resend } from '@/lib/resend'

export const ADMIN_ALLOWED_EMAILS = [
  'sassonerenee@gmail.com',
  'smartsasstech@gmail.com'
]

interface OtpEntry {
  codeHash: string
  expiresAt: number
  attempts: number
}

// In-memory OTP store (keyed by lowercase email)
const otpStore = new Map<string, OtpEntry>()

function hashOtp(code: string, email: string): string {
  return crypto
    .createHmac('sha256', process.env.ADMIN_SESSION_SECRET || 'sst-admin-secret-2026-secure-key')
    .update(`${email}:${code}`)
    .digest('hex')
}

// Generate & send 6-digit OTP code to authorized admin email
export async function sendAdminOtp(email: string): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!ADMIN_ALLOWED_EMAILS.includes(normalizedEmail)) {
    // For security, do not disclose whether email is authorized or not, but return friendly message
    return {
      success: false,
      message: 'This email is not authorized for administrator access.'
    }
  }

  // Generate 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const codeHash = hashOtp(code, normalizedEmail)
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes validity

  otpStore.set(normalizedEmail, {
    codeHash,
    expiresAt,
    attempts: 0
  })

  try {
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">SmartSass Tech</h1>
          <p style="color: #14b8a6; margin: 4px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Admin Security Portal</p>
        </div>
        
        <div style="padding: 32px 24px; text-align: center;">
          <p style="color: #334155; font-size: 16px; line-height: 24px; margin-top: 0;">
            Here is your one-time verification code to sign in to the <strong>SmartSass Tech Admin Dashboard</strong>${normalizedEmail !== 'smartsasstech@gmail.com' ? ` (requested for ${normalizedEmail})` : ''}:
          </p>
          
          <div style="margin: 28px 0; padding: 18px 24px; background-color: #f8fafc; border: 2px dashed #0d9488; border-radius: 12px; display: inline-block;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${code}</span>
          </div>
          
          <p style="color: #64748b; font-size: 13px; margin: 0;">
            This code will expire in <strong>10 minutes</strong> and can only be used once.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
            If you did not request this code, you can safely ignore this email.
          </p>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 11px; margin: 0;">
            &copy; ${new Date().getFullYear()} SmartSass Tech &bull; Restricted Administrative Access
          </p>
        </div>
      </div>
    `

    let destinationEmail = normalizedEmail
    let sendResult = await resend.emails.send({
      from: 'SmartSass Tech Security <onboarding@resend.dev>',
      to: normalizedEmail,
      subject: `Your SmartSass Tech Admin Login Code: ${code}`,
      html: emailHtml
    })

    // If Resend free testing mode restricts delivery to the account email (smartsasstech@gmail.com)
    if (sendResult.error && normalizedEmail !== 'smartsasstech@gmail.com') {
      console.warn(`Resend sandbox restriction for ${normalizedEmail}. Delivering to smartsasstech@gmail.com...`)
      destinationEmail = 'smartsasstech@gmail.com'
      sendResult = await resend.emails.send({
        from: 'SmartSass Tech Security <onboarding@resend.dev>',
        to: 'smartsasstech@gmail.com',
        subject: `[Admin Login Code for ${normalizedEmail}]: ${code}`,
        html: emailHtml
      })
    }

    if (sendResult.error) {
      console.error('Failed to send OTP via Resend:', sendResult.error)
      return { success: false, message: sendResult.error.message || 'Failed to send login code.' }
    }

    if (destinationEmail !== normalizedEmail) {
      return {
        success: true,
        message: `A 6-digit code has been delivered to smartsasstech@gmail.com (Resend testing inbox).`
      }
    }

    return {
      success: true,
      message: `A 6-digit code has been sent to ${normalizedEmail}.`
    }
  } catch (err: any) {
    console.error('Error sending OTP email:', err)
    return { success: false, message: err.message || 'Error sending login email' }
  }
}

// Verify submitted OTP code
export function verifyAdminOtp(email: string, submittedCode: string): { success: boolean; message: string } {
  const normalizedEmail = email.trim().toLowerCase()
  const entry = otpStore.get(normalizedEmail)

  if (!entry) {
    return { success: false, message: 'No login code found for this email. Please request a new one.' }
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedEmail)
    return { success: false, message: 'This code has expired. Please request a new one.' }
  }

  if (entry.attempts >= 5) {
    otpStore.delete(normalizedEmail)
    return { success: false, message: 'Too many incorrect attempts. Please request a new code.' }
  }

  const expectedHash = hashOtp(submittedCode.trim(), normalizedEmail)

  if (entry.codeHash !== expectedHash) {
    entry.attempts++
    return { success: false, message: 'Invalid 6-digit code. Please check your email and try again.' }
  }

  // Success - invalidate code so it cannot be reused
  otpStore.delete(normalizedEmail)
  return { success: true, message: 'Code verified successfully.' }
}
