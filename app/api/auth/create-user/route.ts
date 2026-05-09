import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resend } from '@/lib/resend'
import { getSetPasswordEmailHtml } from '@/lib/emails/SetPasswordEmail'

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, phone, role = 'client', password, sendSetupEmail } = await request.json()
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

    // Determine the password to use
    // If agent provided a password, use it. Otherwise generate a temporary one.
    const useAgentPassword = !!password && password.length >= 8
    const accountPassword = useAgentPassword 
      ? password 
      : Math.random().toString(36).slice(-12) + 'A1!'

    // 3. Create user in Supabase Auth via Admin API
    // email_confirm: true marks the email as already verified so they can log in immediately.
    const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: accountPassword,
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

    // 4. If no password was provided, send a "Set Up Your Password" email
    let emailSent = false
    if (sendSetupEmail && !useAgentPassword) {
      try {
        const origin = new URL(request.url).origin

        // Generate a password recovery link so the client can set their own password
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
        })

        if (linkError) {
          console.error('[Create User API] Link generation error:', linkError)
          // Account was created but email failed — don't fail the whole request
        } else {
          const tokenHash = linkData.properties.hashed_token
          const resetLink = `${origin}/auth/confirm?token_hash=${tokenHash}&type=recovery&next=/account`

          const emailHtml = getSetPasswordEmailHtml(firstName.trim(), resetLink)

          const { error: sendError } = await resend.emails.send({
            from: 'SmartSass Tech <welcome@smartsasstech.com>',
            to: email,
            subject: 'Set Up Your SmartSass Tech Password',
            html: emailHtml,
          })

          if (sendError) {
            console.error('[Create User API] Resend error:', sendError)
          } else {
            emailSent = true
          }
        }
      } catch (emailError) {
        console.error('[Create User API] Email sending failed:', emailError)
      }
    }

    // 5. Build response message
    let message = 'Account created successfully.'
    if (useAgentPassword) {
      message = 'Account created with the password you provided. The client can log in immediately.'
    } else if (sendSetupEmail && emailSent) {
      message = 'Account created! A password setup email has been sent to the client.'
    } else if (sendSetupEmail && !emailSent) {
      message = 'Account created, but the setup email could not be sent. You may need to send a password reset manually.'
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        role: role
      },
      emailSent,
      message
    })

  } catch (error: any) {
    console.error('[Create User API] Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
