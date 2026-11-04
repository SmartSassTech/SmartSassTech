import crypto from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const COOKIE_NAME = 'sst_admin_session'
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7 // 7 days

// Get or fallback session secret
const SECRET_KEY = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'sst-admin-secret-2026-secure-key'

// Supabase Admin Client (Service Role for backend data fetching)
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface AdminSession {
  userId: string
  email: string
  role: string
  name: string
  issuedAt: number
  expiresAt: number
}

// Generate signed session token: Base64(payload).Signature
export function createSessionToken(payload: Omit<AdminSession, 'issuedAt' | 'expiresAt'>): string {
  const now = Math.floor(Date.now() / 1000)
  const sessionData: AdminSession = {
    ...payload,
    issuedAt: now,
    expiresAt: now + SESSION_EXPIRY_SECONDS
  }

  const encodedPayload = Buffer.from(JSON.stringify(sessionData)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encodedPayload)
    .digest('base64url')

  return `${encodedPayload}.${signature}`
}

// Verify signed session token
export function verifySessionToken(token: string | undefined | null): AdminSession | null {
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null

    const [encodedPayload, signature] = parts
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(encodedPayload)
      .digest('base64url')

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null
    }

    const sessionData: AdminSession = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    )

    const now = Math.floor(Date.now() / 1000)
    if (sessionData.expiresAt < now) {
      return null
    }

    return sessionData
  } catch (err) {
    return null
  }
}

// Server-side check for API routes and server components
export async function getAdminSessionFromCookies(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return verifySessionToken(token)
}

export { COOKIE_NAME, SESSION_EXPIRY_SECONDS }
