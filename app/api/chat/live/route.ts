import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resend } from '@/lib/resend'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
    // Rate limit: 5 live chat requests per minute per IP
    const ip = getClientIp(req)
    const { success, resetAt } = rateLimit(ip, { limit: 5, windowSeconds: 60 })
    if (!success) {
        return NextResponse.json(
            { error: 'Too many requests. Please wait a moment before trying again.' },
            {
                status: 429,
                headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) },
            }
        )
    }

    try {
        const body = await req.json()
        const { name, email, phone, device, issue, user_id, website, history } = body

        // Honeypot: bots fill hidden fields; real users leave this blank
        if (website) {
            // Return a fake success to not tip off bots
            return NextResponse.json({ success: true, sessionId: null }, { status: 200 })
        }

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and email are required fields' }, { status: 400 })
        }

        // 1. Create a session in Supabase using direct insert
        const { data: sessionData, error: supabaseError } = await supabase
            .from('chat_sessions')
            .insert({
                user_name: name,
                user_email: email,
                user_phone: phone || null,
                user_device: device || null,
                initial_issue: issue || 'No issue described',
                user_id: user_id || null
            })
            .select('id')
            .single()

        const sessionId = sessionData?.id

        if (supabaseError || !sessionId) {
            console.error('Supabase error:', supabaseError)
            return NextResponse.json({
                error: `Database Error: ${supabaseError?.message || 'Failed to create session'}`,
                details: supabaseError?.hint || 'Ensure the Postgres function exists and permissions are granted.'
            }, { status: 500 })
        }

        // 1b. Insert the initial system message and history into chat_messages
        const messagesToInsert = []
        if (history && Array.isArray(history)) {
            messagesToInsert.push(...history.map((m: any) => ({
                session_id: sessionId,
                sender_type: m.role === 'assistant' ? 'ai' : (m.role === 'system' ? 'system' : 'user'),
                message_content: m.content
            })))
        }
        
        messagesToInsert.push({
            session_id: sessionId,
            sender_type: 'system',
            message_content: 'Connected to support. A technical expert will be with you shortly.'
        })

        const { error: insertError } = await supabaseAdmin.from('chat_messages').insert(messagesToInsert)
        if (insertError) {
            console.error('Failed to insert chat history:', insertError)
        }

        const chatLink = `${req.nextUrl.origin}/admin/live-chat/${sessionId}?admin=true`

        // 2. Send email via Resend
        try {
            await resend.emails.send({
                from: 'Support <onboarding@resend.dev>',
                to: 'smartsasstech@gmail.com',
                subject: 'URGENT: New Human Chat Request',
                html: `
                    <h2>New Chat Request</h2>
                    <p><strong>User:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone || 'Not specified'}</p>
                    <p><strong>Device:</strong> ${device || 'Not specified'}</p>
                    <p><strong>Issue:</strong> ${issue || 'No initial issue description provided'}</p>
                    <p><a href="${chatLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Chat Session</a></p>
                `
            })
        } catch (emailError) {
            console.error('Resend email error:', emailError)
        }

        // 3. Notify agents via in-app notification
        await import('@/lib/notifications').then(m => m.notifyAgents(
            'New Live Chat Request',
            `${name} has requested a live chat session.`,
            'system',
            { session_id: sessionId }
        )).catch(console.error)

        return NextResponse.json({ success: true, sessionId, chatLink })
    } catch (error: any) {
        console.error('Live chat API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
