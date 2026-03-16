import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resend } from '@/lib/resend'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    // Rate limit: 5 submissions per 10 minutes per IP
    const ip = getClientIp(request)
    const { success, resetAt } = rateLimit(ip, { limit: 5, windowSeconds: 600 })
    if (!success) {
        return NextResponse.json(
            { error: 'Too many submissions. Please wait a few minutes before trying again.' },
            {
                status: 429,
                headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) },
            }
        )
    }

    try {
        const { name, email, phone, message, website } = await request.json()

        // Honeypot: bots fill hidden fields; real users leave this blank
        if (website) {
            // Return 200 to not tip off bots, but don't process the submission
            return NextResponse.json({ success: true, message: 'Contact submission received' }, { status: 200 })
        }

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
        const { data: submission, error: supabaseError } = await supabase
            .from('contact_submissions')
            .insert([
                { name, email, phone, message, user_id: userId }
            ])
            .select('id')
            .single()

        if (supabaseError) {
            console.error('Supabase error:', supabaseError)
            return NextResponse.json(
                { error: 'Failed to save submission' },
                { status: 500 }
            )
        }

        // 2b. Auto-create a support ticket from the contact submission
        try {
            const SLA_FIRST_RESPONSE_HOURS = 4
            const SLA_RESOLUTION_HOURS = 24
            const now = Date.now()

            await supabaseAdmin
                .from('support_tickets')
                .insert({
                    subject: `Contact Form: ${name}`,
                    description: message,
                    status: 'open',
                    priority: 'medium',
                    category: 'General',
                    source: 'contact_form',
                    user_id: userId,
                    contact_submission_id: submission?.id || null,
                    first_response_due: new Date(now + SLA_FIRST_RESPONSE_HOURS * 60 * 60 * 1000).toISOString(),
                    resolution_due: new Date(now + SLA_RESOLUTION_HOURS * 60 * 60 * 1000).toISOString(),
                })
        } catch (ticketErr) {
            console.error('Error auto-creating support ticket from contact form:', ticketErr)
            // Don't fail the contact submission if ticket creation fails
        }

        // 3. Send email via Resend
        try {
            const accountNote = userId ? '<p style="color: green; font-weight: bold;">(Connected to Existing Account)</p>' : ''

            await resend.emails.send({
                from: 'SmartSassTech <notifications@resend.dev>',
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
            // Log the email error but don't fail — submission is already saved in Supabase
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
