import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resend } from '@/lib/resend'
import { getWelcomeEmailHtml } from '@/lib/emails/WelcomeEmail'

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, phone, referralCode } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Check if user already exists in profiles (to provide better error)
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 })
    }

    // 2. Handle Referral Code
    let referredBy: string | null = null
    if (referralCode) {
      const { data: referrer, error: referrerError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode.trim())
        .single()
      
      if (referrer) {
        referredBy = referrer.id
      }
    }

    // 3. Create user in Supabase Auth via Admin API
    // We set email_confirm: false so Supabase doesn't send its own generic email
    const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone?.trim() || null,
        referred_by: referredBy
      },
      email_confirm: false
    })

    if (signUpError) {
      console.error('[Sign-up API] Auth error:', signUpError)
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    const user = userData.user
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user account.' }, { status: 500 })
    }

    // 3. Generate confirmation hash
    const origin = new URL(request.url).origin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
    })

    if (linkError) {
      console.error('[Sign-up API] Link generation error:', linkError)
      return NextResponse.json({ error: 'Failed to generate verification link.' }, { status: 500 })
    }

    // Use the hashed_token to build a link directly to our /auth/confirm route
    // This avoids the double-spent token issue that happens when using action_link
    const tokenHash = linkData.properties.hashed_token
    const verificationLink = `${origin}/auth/confirm?token_hash=${tokenHash}&type=signup&next=/account`

    // 4. Send branded email via Resend
    const emailHtml = getWelcomeEmailHtml(firstName.trim(), verificationLink)

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: 'SmartSass Tech <welcome@smartsasstech.com>',
      to: email,
      subject: 'Verify your SmartSass Tech account',
      html: emailHtml,
    })

    if (sendError) {
      console.error('[Sign-up API] Resend error:', sendError)
      return NextResponse.json({ 
        error: `Account created, but we failed to send the confirmation email: ${sendError.message}. Please contact support.` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account created! Please check your email for the branded confirmation link.' 
    })

  } catch (error: any) {
    console.error('[Sign-up API] Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred during sign-up.' }, { status: 500 })
  }
}
