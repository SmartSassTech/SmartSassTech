import { NextRequest, NextResponse } from 'next/server'
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
        const {
            name,
            phone,
            cityZip,
            message,
            serviceType,
            remotePlatform,
            knowsRemoteEmail,
            remoteEmailDetails,
            website,
        } = await request.json()

        // Honeypot: bots fill hidden fields; real users leave this blank
        if (website) {
            return NextResponse.json({ success: true, message: 'Contact submission received' }, { status: 200 })
        }

        // Validate required fields
        if (!name || !phone) {
            return NextResponse.json(
                { error: 'Name and phone number are required' },
                { status: 400 }
            )
        }

        // Phone format validation
        const phoneRegex = /^[0-9\s\-\(\)\+]+$/
        if (!phoneRegex.test(phone)) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400 }
            )
        }

        // Send email to smartsasstech@gmail.com via Resend
        await resend.emails.send({
            from: 'SmartSassTech <notifications@resend.dev>',
            to: 'smartsasstech@gmail.com',
            subject: `New Contact from ${name} (${serviceType === 'remote' ? 'Remote' : 'In-Home'})`,
            html: `
        <h2 style="color: #2e3b69;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>City/Zip:</strong> ${cityZip || 'N/A'}</p>
        <p><strong>Service Preference:</strong> ${serviceType || 'N/A'}</p>
        ${serviceType === 'remote' ? `
          <div style="background-color: #f0f4f8; padding: 12px; border-radius: 8px; margin: 12px 0;">
            <h3 style="margin-top: 0; color: #2e3b69;">Remote Support Info</h3>
            <p><strong>Platform:</strong> ${remotePlatform || 'Not specified'}</p>
            <p><strong>Knows Account Email:</strong> ${knowsRemoteEmail || 'Not specified'}</p>
            <p><strong>Video Account Email:</strong> ${remoteEmailDetails || 'Needs help getting info'}</p>
          </div>
        ` : ''}
        <p><strong>Message / Notes:</strong></p>
        <p style="white-space: pre-wrap; background-color: #fafafa; padding: 12px; border-radius: 6px;">${message || '(No message provided)'}</p>
      `,
        })

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
