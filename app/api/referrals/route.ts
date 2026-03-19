import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await request.json()
    const referredEmail = email?.trim().toLowerCase()
    
    if (!referredEmail) {
      return NextResponse.json({ error: 'Missing email address' }, { status: 400 })
    }

    // 1. Prevent referring self
    if (referredEmail === user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'You cannot refer yourself.' }, { status: 400 })
    }

    // 2. Check if the email already exists in profiles (Existing User)
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', referredEmail)
      .maybeSingle()

    if (profileError) {
      console.error('[Referrals API] Profile check error:', profileError)
    }

    if (existingProfile) {
      return NextResponse.json({ error: 'This person is already a user of our services.' }, { status: 400 })
    }

    // 3. Check if the email has already booked a session
    const { data: existingBooking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('customer_email', referredEmail)
      .maybeSingle()

    if (bookingError) {
      console.error('[Referrals API] Booking check error:', bookingError)
    }

    if (existingBooking) {
      return NextResponse.json({ error: 'This person has already booked a session with us.' }, { status: 400 })
    }

    // Insert into referrals table using admin client to bypass RLS if necessary, 
    // or just to ensure it works consistently server-side.
    const { error: insertError } = await supabaseAdmin
        .from('referrals')
        .insert({
            referrer_id: user.id,
            referred_email: referredEmail
        })

    if (insertError) {
      // Check for unique constraint (one referral per email)
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'This email has already been referred.' }, { status: 400 })
      }
      console.error('[Referrals API] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save referral. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Referral sent successfully!' 
    })

  } catch (error: any) {
    console.error('[Referrals API] Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
