import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdmin, createSessionToken, getAdminSessionFromCookies, COOKIE_NAME, SESSION_EXPIRY_SECONDS } from '@/lib/admin-auth'

const ADMIN_ALLOWED_EMAILS = [
  'smartsasstech@gmail.com',
  'sassonerenee@gmail.com'
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      )
    }

    const trimmedEmail = (email || '').trim().toLowerCase()
    const trimmedPassword = password.trim()
    const envAdminPass = process.env.ADMIN_PASSWORD || 'SmartSassAdmin2026!'

    let authenticatedUser = null

    // 1. Check Master Admin Password fallback
    if (trimmedPassword === envAdminPass) {
      authenticatedUser = {
        userId: 'admin-master-root',
        email: trimmedEmail || 'smartsasstech@gmail.com',
        role: 'admin',
        name: 'SmartSass Tech Administrator'
      }
    }

    // 2. If not matched, try Supabase Auth signInWithPassword
    if (!authenticatedUser && trimmedEmail) {
      try {
        const supabase = getSupabaseAdmin()
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword
        })

        if (!authError && authData?.user) {
          // Check role in profiles or email whitelist
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, first_name, last_name')
            .eq('id', authData.user.id)
            .single()

          const role = profile?.role || 'agent'
          const isAllowedEmail = ADMIN_ALLOWED_EMAILS.includes(trimmedEmail)

          if (role === 'admin' || role === 'agent' || isAllowedEmail) {
            authenticatedUser = {
              userId: authData.user.id,
              email: authData.user.email || trimmedEmail,
              role: role,
              name: `${profile?.first_name || 'Admin'} ${profile?.last_name || ''}`.trim()
            }
          }
        }
      } catch (err) {
        console.error('Supabase auth sign-in attempt error:', err)
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or admin password.' },
        { status: 401 }
      )
    }

    // Create signed session token
    const token = createSessionToken(authenticatedUser)

    // Set secure httpOnly cookie
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
      user: authenticatedUser
    })
  } catch (error: any) {
    console.error('Admin Auth Error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const session = await getAdminSessionFromCookies()

  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }

  return NextResponse.json({
    authenticated: true,
    user: session
  })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)

  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  })
}
