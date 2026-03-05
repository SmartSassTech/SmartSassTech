import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { resend } from '@/lib/resend'

export async function POST(request: NextRequest) {
    try {
        const { name, email, phone, message } = await request.json()

        // Validate input
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email, and message are required' },
                { status: 400 }
            )
        }

        // Phone validation (if provided)
        if (phone) {
            const phoneRegex = /^[0-9\s\-\(\)\+]+$/
            if (!phoneRegex.test(phone)) {
                return NextResponse.json(
                    { error: 'Invalid phone number format' },
                    { status: 400 }
                )
            }
        }

        // 1. Check if email exists in profiles to link account
        let userId: string | null = null
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        console.log('Account linking check:', { email, profile, profileError })

        if (profile) {
            userId = profile.id
        }

        // 2. Insert into Supabase
        const { error: supabaseError } = await supabase
            .from('contact_submissions')
            .insert([
                { name, email, phone, message, user_id: userId }
            ])

        if (supabaseError) {
            console.error('Supabase error:', supabaseError)
            return NextResponse.json(
                { error: 'Failed to save submission' },
                { status: 500 }
            )
        }

        // 3. Send email via Resend
        try {
            const accountNote = userId ? '<p style="color: green; font-weight: bold;">(Connected to Existing Account)</p>' : ''

            await resend.emails.send({
                from: 'SmartSassTech <notifications@resend.dev>', // Resend default for testing, should be updated to a verified domain if available
                to: 'smartsasstech@gmail.com',
                subject: `New Contact Form Submission from ${name} ${userId ? '[Existing Account]' : ''}`,
                html: `
          <h1>New Contact Form Submission</h1>
          ${accountNote}
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `
            })
        } catch (emailError) {
            // We log the email error but don't fail the whole request because it's already saved in Supabase
            console.error('Email error:', emailError)
        }

        return NextResponse.json(
            { success: true, message: 'Contact submission received' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error handling contact request:', error)
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        )
    }
}
