import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminOtp } from '@/lib/admin-otp'
import { createSessionToken, COOKIE_NAME, SESSION_EXPIRY_SECONDS, getSupabaseAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email and 6-digit code are required.' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()
    const verification = verifyAdminOtp(trimmedEmail, code)

    if (!verification.success) {
      return NextResponse.json(verification, { status: 400 })
    }

    // Lookup profile info if available
    let name = 'SmartSass Tech Administrator'
    try {
      const supabase = getSupabaseAdmin()
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('email', trimmedEmail)
        .single()

      if (profile?.first_name) {
        name = `${profile.first_name} ${profile.last_name || ''}`.trim()
      }
    } catch (err) {
      // Continue with default name
    }

    const authenticatedUser = {
      userId: `admin-${trimmedEmail}`,
      email: trimmedEmail,
      role: 'admin',
      name: name
    }

    // Create session token and set httpOnly cookie
    const token = createSessionToken(authenticatedUser)
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_SECONDS
    })

    return NextResponse.json({
      success: true,
      user: authenticatedUser,
      message: 'Authentication successful.'
    })
  } catch (error: any) {
    console.error('Error in verify OTP route:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to verify code' },
      { status: 500 }
    )
  }
}
