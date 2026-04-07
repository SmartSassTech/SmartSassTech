import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, phone, role = 'client' } = await request.json()
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    // 1. Verify the requester's identity and get their role
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requester) {
      console.error('[Create User API] Requester verification failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requesterRole = requester.app_metadata?.role || 'client'
    const isAgent = requesterRole === 'agent' || requesterRole === 'admin'

    // 2. Authorization check
    if (!isAgent) {
      return NextResponse.json({ error: 'You do not have permission to create accounts.' }, { status: 403 })
    }

    // Agents cannot create admin accounts
    if (requesterRole === 'agent' && role === 'admin') {
      return NextResponse.json({ error: 'Agents cannot create administrator accounts.' }, { status: 403 })
    }

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. Create user in Supabase Auth via Admin API
    // Agent-created accounts are silent — no emails sent to the new user.
    // email_confirm: true marks the email as already verified so they can log in immediately.
    const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!'
    
    const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone?.trim() || null
      },
      app_metadata: {
        role: role
      },
      email_confirm: true
    })

    if (signUpError) {
      console.error('[Create User API] Auth error:', signUpError)
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    const user = userData.user
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user account.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        role: role
      },
      message: 'Account created successfully.' 
    })

  } catch (error: any) {
    console.error('[Create User API] Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
