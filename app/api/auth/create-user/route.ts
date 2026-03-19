import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resend } from '@/lib/resend'
import { getWelcomeEmailHtml } from '@/lib/emails/WelcomeEmail'

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
    // We generate a random password since the agent is creating the account
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
      email_confirm: false
    })

    if (signUpError) {
      console.error('[Create User API] Auth error:', signUpError)
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    const user = userData.user
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user account.' }, { status: 500 })
    }

    // 4. Generate confirmation hash (optional but good for getting them to set password)
    const origin = new URL(request.url).origin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password: temporaryPassword,
    })

    if (linkError) {
      console.error('[Create User API] Link generation error:', linkError)
      // We still created the user, but couldn't generate a link. 
      // This is not a total failure.
    } else {
      const tokenHash = linkData.properties.hashed_token
      const verificationLink = `${origin}/auth/confirm?token_hash=${tokenHash}&type=signup&next=/account`

      // 5. Send branded email via Resend
      const emailHtml = getWelcomeEmailHtml(firstName.trim(), verificationLink)

      await resend.emails.send({
        from: 'SmartSass Tech <welcome@smartsasstech.com>',
        to: email,
        subject: 'Welcome to SmartSass Tech - Your account has been created',
        html: emailHtml,
      }).catch(err => {
        console.error('[Create User API] Resend error:', err)
      })
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
